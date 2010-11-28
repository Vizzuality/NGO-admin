namespace :iom do
  namespace :visits do
    desc 'Update all visits from the site'
    task :update => :environment do
      Site.all.each do |site|
        site.set_visits!
        site.set_visits_from_last_week!
      end
    end
  end
end