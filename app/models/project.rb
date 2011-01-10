# == Schema Information
#
# Table name: projects
#
#  id                                      :integer         not null, primary key
#  name                                    :string(2000)    
#  description                             :text            
#  primary_organization_id                 :integer         
#  implementing_organization               :text            
#  partner_organizations                   :text            
#  cross_cutting_issues                    :text            
#  start_date                              :date            
#  end_date                                :date            
#  budget                                  :float           
#  target                                  :text            
#  estimated_people_reached                :integer         
#  contact_person                          :string(255)     
#  contact_email                           :string(255)     
#  contact_phone_number                    :string(255)     
#  site_specific_information               :text            
#  created_at                              :datetime        
#  updated_at                              :datetime        
#  the_geom                                :string          not null
#  activities                              :text            
#  intervention_id                         :string(255)     
#  additional_information                  :text            
#  awardee_type                            :string(255)     
#  date_provided                           :date            
#  date_updated                            :date            
#  contact_position                        :string(255)     
#  website                                 :string(255)     
#  verbatim_location                       :text            
#  calculation_of_number_of_people_reached :text            
#  project_needs                           :text            
#  idprefugee_camp                         :text            
#

class Project < ActiveRecord::Base

  belongs_to :primary_organization, :foreign_key => :primary_organization_id, :class_name => 'Organization'
  has_and_belongs_to_many :clusters
  has_and_belongs_to_many :sectors
  has_and_belongs_to_many :regions, :after_add => :add_to_country, :after_remove => :remove_from_country
  has_and_belongs_to_many :countries
  has_and_belongs_to_many :tags, :after_add => :update_tag_counter, :after_remove => :update_tag_counter
  has_many :resources, :conditions => 'resources.element_type = #{Iom::ActsAsResource::PROJECT_TYPE}', :foreign_key => :element_id, :dependent => :destroy
  has_many :media_resources, :conditions => 'media_resources.element_type = #{Iom::ActsAsResource::PROJECT_TYPE}', :foreign_key => :element_id, :dependent => :destroy, :order => 'position ASC'
  has_many :donations, :dependent => :destroy
  has_many :donors, :through => :donations
  has_many :cached_sites, :class_name => 'Site', :finder_sql => 'select sites.* from sites, projects_sites where projects_sites.project_id = #{id} and projects_sites.site_id = sites.id'

  validates_presence_of :primary_organization_id, :name

  validate :dates_consistency#, :presence_of_clusters_and_sectors

  after_save :set_cached_sites
  after_destroy :remove_cached_sites

  attr_accessor :sectors_ids, :clusters_ids

  def before_save
    self.the_geom ||= Point.from_x_y(1,1)
  end

  def sectors_ids=(value)
    value.each do |sector_id|
      if sector = Sector.find(sector_id)
        sectors << sector unless sectors.include?(sector)
      end
    end
  end

  def clusters_ids=(value)
    value.each do |cluster_id|
      if cluster = Cluster.find(cluster_id)
        clusters << cluster unless clusters.include?(cluster)
      end
    end
  end

  def tags=(tag_names)
    return if tag_names.blank?
    if tag_names.is_a?(String)
      tag_names = tag_names.split(',').map{ |t| t.strip }.compact.delete_if{ |t| t.blank? }
    end
    Tag.transaction do
      tags.clear
      tag_names.each do |tag_name|
        if tag = Tag.find_by_name(tag_name)
          unless tags.include?(tag)
            tags << tag
          end
        else
          tag = Tag.create :name => tag_name
          tags << tag
        end
      end
    end
  end

  def budget=(ammount)
    return if ammount.blank?

    case ammount
      when String then write_attribute(:budget, ammount.delete(',').to_f)
      when Float  then write_attribute(:budget, ammount)
    end
  end

  def update_tag_counter(tag)
    tag.update_tag_counter
  end

  def finished?
    if (!end_date.nil?)
      end_date < Date.today
    else
      false
    end
  end

  def months_left
    unless finished? || end_date.nil?
      (end_date - Date.today).to_i / 30
    else
      nil
    end
  end

  def to_kml
    the_geom.as_kml if the_geom.present?
  end

  def to_csv(site_id)
    sql = <<-SQL
      SELECT *
      FROM v_projects_denormalized
      WHERE id = #{self.id}
    SQL

    result = ActiveRecord::Base.connection.execute(sql)
    result.serialize_to_csv
  end

  def related(site, limit = 2)
    return [] unless the_geom?
    result = Project.find_by_sql(<<-SQL
      select * from
      (select p.id, p.name, p.primary_organization_id, o.name as primary_organization_name, c.name as country_name,
           ST_Distance((select ST_Centroid(p.the_geom) from projects where id=#{self.id}), ST_Centroid(p.the_geom)) as dist
           from organizations o, projects as p
           inner join projects_sites as ps on p.id=ps.project_id and ps.site_id=#{site.id}
           inner join countries_projects as cp on ps.project_id=cp.project_id
           inner join countries as c on cp.country_id=c.id
           where p.id!=#{self.id} and o.id=p.primary_organization_id
           order by dist
      ) as subq
      limit #{limit}
SQL
    )
    return result unless result.empty?
    # If there are not close projects try with projects of a different organization
    result = Project.find_by_sql(<<-SQL
      select * from
      (select p.id, p.name, p.primary_organization_id, o.name as primary_organization_name, c.name as country_name,
           ST_Distance((select ST_Centroid(p.the_geom) from projects where id=#{self.id}), ST_Centroid(p.the_geom)) as dist
           from organizations o, projects as p
           inner join projects_sites as ps on p.id=ps.project_id and ps.site_id=#{site.id}
           inner join countries_projects as cp on ps.project_id=cp.project_id
           inner join countries as c on cp.country_id=c.id
           where p.id!=#{self.id}
           order by dist
      ) as subq
      limit #{limit}
SQL
    )
    return result unless result.empty?
    total_projects = site.total_projects
    return [] if total_projects < 2
    offset = rand(total_projects - 2)
    Project.find_by_sql(<<-SQL
      select projects.* from projects inner join projects_sites on projects_sites.site_id=#{site.id}
      limit 2 offset #{offset}
SQL
    )
  end

  def self.custom_find(site, options = {})
    default_options = {
      :order => 'project_id DESC',
      :random => true,
    }
    options = default_options.merge(options)
    options[:page] ||= 1
    level = options[:level] ? options[:level] : site.levels_for_region.max

    sql = ""
    if options[:region]
      sql="select * from data_denormalization where regions_ids && '{#{options[:region]}}' and site_id=#{site.id} and is_active=true"
    elsif options[:cluster]
      sql="select * from data_denormalization where cluster_ids && '{#{options[:cluster]}}' and site_id=#{site.id} and is_active=true"
    elsif options[:sector]
      sql="select * from data_denormalization where sector_ids && '{#{options[:sector]}}' and site_id=#{site.id} and is_active=true"
    elsif options[:organization]
      sql="select * from data_denormalization where organization_id = #{options[:organization]} and site_id=#{site.id} and is_active=true"
    elsif options[:donor_id]
      sql="select * from data_denormalization where donors_ids && '{#{options[:donor_id]}}' and site_id=#{site.id} and is_active=true"
    else
      sql="select * from data_denormalization where site_id=#{site.id} and is_active=true"
    end

    if options[:country]
      sql << " WHERE "
      conditions = []
      if options[:country]
        conditions << "countries_ids && '{#{options[:country]}}'"
      end
      sql << conditions.join(' and ')
    end

    total_entries = ActiveRecord::Base.connection.execute("select count(*) as count from (#{sql}) as q").first['count'].to_i

    total_pages = (total_entries.to_f / options[:per_page].to_f).ceil

    start_in_page = if options[:start_in_page]
      options[:start_in_page].to_i
    else
      if total_pages
        if total_pages > 2
          rand(total_pages - 1)
        else
          0
        end
      else
        0
      end
    end

    if options[:order]
      sql << " ORDER BY #{options[:order]}"
    end
    # Let's query an extra result: if it exists, whe have to show the paginator link "More projects"
    if options[:per_page]
      sql << " LIMIT #{options[:per_page].to_i}"
    end
    if options[:page] && options[:per_page]
      #####
      # start_in_page =  4
      # total_pages   =  7
      # per_page      = 10
      #
      # page = 1 > real page = 5 > offset = 40
      # page = 2 > real page = 6 > offset = 50
      # page = 3 > real page = 7 > offset = 60
      # page = 4 > real page = 1 > offset = 0
      # page = 5 > real page = 2 > offset = 10
      offset = if (options[:page].to_i + start_in_page - 1) <= total_pages
        options[:per_page].to_i * (options[:page].to_i + start_in_page - 1)
      else
        options[:per_page].to_i * (options[:page].to_i - start_in_page)
      end
      sql << " OFFSET #{offset}"
    end
    result = ActiveRecord::Base.connection.execute(sql).map{ |r| r }
    WillPaginate::RandomCollection.create(options[:page] ? options[:page].to_i : 1, options[:per_page], total_entries, start_in_page) do |pager|
      pager.replace(result.sort_by{rand})
    end
  end

  def self.custom_fields
    (columns.map{ |c| c.name }).map{ |c| "#{self.table_name}.#{c}" }
  end

  def the_geom_to_value
    return "" if the_geom.blank? || !the_geom.respond_to?(:points)
    the_geom.points.map do |point|
      "(#{point.y} #{point.x})"
    end.join(',')
  end

  def countries_ids
    return "" if self.new_record?
    sql = "select country_id from countries_projects where project_id=#{self.id}"
    ActiveRecord::Base.connection.execute(sql).map{ |r| r['country_id'] }.join(',')
  end

  def regions_level1_ids
    return "" if self.new_record?
    sql = "select region_id from projects_regions
    inner join regions on regions.id=projects_regions.region_id and regions.level=1
    where project_id=#{self.id}"
    ActiveRecord::Base.connection.execute(sql).map{ |r| r['region_id'] }.uniq.join(',')
  end

  def regions_level2_ids
    return "" if self.new_record?
    sql = "select region_id from projects_regions
    inner join regions on regions.id=projects_regions.region_id and regions.level=2
    where project_id=#{self.id}"
    ActiveRecord::Base.connection.execute(sql).map{ |r| r['region_id'] }.uniq.join(',')
  end

  def regions_level3_ids
    return "" if self.new_record?
    sql = "select region_id from projects_regions
    inner join regions on regions.id=projects_regions.region_id and regions.level=3
    where project_id=#{self.id}"
    ActiveRecord::Base.connection.execute(sql).map{ |r| r['region_id'] }.uniq.join(',')
  end

  def set_cached_sites
    remove_cached_sites
    Site.all.each do |site|
      if site.projects.map(&:id).include?(self.id)
        sql = "insert into projects_sites (project_id, site_id) values (#{self.id}, #{site.id})"
        ActiveRecord::Base.connection.execute(sql)
        sql = "insert into data_denormalization(project_id,project_name,project_description,organization_id,organization_name,end_date,regions,regions_ids,countries,countries_ids,sectors,sector_ids,clusters,cluster_ids,donors_ids,is_active,site_id,created_at)
        select  * from
               (SELECT p.id as project_id, p.name as project_name, p.description as project_description,
               o.id as organization_id, o.name as organization_name,
               p.end_date as end_date,
               '|'||array_to_string(array_agg(distinct r.name),'|')||'|' as regions,
               ('{'||array_to_string(array_agg(distinct r.id),',')||'}')::integer[] as regions_ids,
               '|'||array_to_string(array_agg(distinct c.name),'|')||'|' as countries,
               ('{'||array_to_string(array_agg(distinct c.id),',')||'}')::integer[] as countries_ids,
               '|'||array_to_string(array_agg(distinct sec.name),'|')||'|' as sectors,
               ('{'||array_to_string(array_agg(distinct sec.id),',')||'}')::integer[] as sector_ids,
               '|'||array_to_string(array_agg(distinct clus.name),'|')||'|' as clusters,
               ('{'||array_to_string(array_agg(distinct clus.id),',')||'}')::integer[] as cluster_ids,
               ('{'||array_to_string(array_agg(distinct d.id),',')||'}')::integer[] as donors_ids,
               CASE WHEN end_date is null OR p.end_date > now() THEN true ELSE false END AS is_active,
               ps.site_id,p.created_at
               FROM projects as p
               INNER JOIN organizations as o ON p.primary_organization_id=o.id
               INNER JOIN projects_sites as ps ON p.id=ps.project_id
               LEFT JOIN projects_regions as pr ON pr.project_id=p.id
               LEFT JOIN regions as r ON pr.region_id=r.id and r.level=#{site.level_for_region}
               LEFT JOIN countries_projects as cp ON cp.project_id=p.id
               LEFT JOIN countries as c ON c.id=cp.country_id
               LEFT JOIN clusters_projects as cpro ON cpro.project_id=p.id
               LEFT JOIN clusters as clus ON clus.id=cpro.cluster_id
               LEFT JOIN projects_sectors as psec ON psec.project_id=p.id
               LEFT JOIN sectors as sec ON sec.id=psec.sector_id
               LEFT JOIN donations as d ON d.project_id=ps.project_id
               where site_id=#{site.id} AND p.id=#{self.id}
               GROUP BY p.id,p.name,o.id,o.name,p.description,p.end_date,ps.site_id,p.created_at) as subq"
         ActiveRecord::Base.connection.execute(sql)
      end
    end
  end

  def remove_cached_sites
    Site.all.each do |site|
      sql = "delete from projects_sites where project_id=#{self.id}"
      ActiveRecord::Base.connection.execute(sql)
      sql = "delete from data_denormalization where project_id=#{self.id}"
      ActiveRecord::Base.connection.execute(sql)
    end
  end

  private

    def dates_consistency
      return true if end_date.nil? || start_date.nil?
      if !end_date.nil? && !start_date.nil? && end_date < start_date
        errors.add(:end_date, "can't be previous to start_date")
      end
      if !date_updated.nil? && !date_provided.nil? && date_updated < date_provided
        errors.add(:date_updated, "can't be previous to date_provided")
      end
    end

    def add_to_country(region)
      return if self.new_record?
      count = ActiveRecord::Base.connection.execute("select count(*) as count from countries_projects where project_id=#{self.id} AND country_id=#{region.country_id}").first['count'].to_i
      if count == 0
        ActiveRecord::Base.connection.execute("INSERT INTO countries_projects (project_id, country_id) VALUES (#{self.id},#{region.country_id})")
      end
    end

    def remove_from_country(region)
      ActiveRecord::Base.connection.execute("DELETE from countries_projects where project_id=#{self.id} AND country_id=#{region.country_id}")
    end

    def presence_of_clusters_and_sectors
      return unless self.new_record?
      if sectors_ids.blank? && sectors.empty?
        errors.add(:sectors, "can't be blank")
      end
      if clusters_ids.blank? && clusters.empty?
        errors.add(:clusters, "can't be blank")
      end
    end
end
