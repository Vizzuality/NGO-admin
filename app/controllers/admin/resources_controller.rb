class Admin::ResourcesController < Admin::AdminController

  before_filter :set_element

  def index
    @resource = @element.resources.new
  end

  def create
    @resource = @element.resources.new(params[:resource])
    @resource.element = @element
    if @resource.save
      redirect_to eval("admin_#{@element.class.name.singularize.downcase}_resources_path(@element)"), :flash => {:success => 'Resource has been created successfully'}
    else
      render :action => 'index'
    end
  end

  def update
    @resource = @element.resources.find(params[:id])
    params[:resource] ||= {}
    if params[:resource]
      params[:resource][:sites_ids] ||= []
    end
    @resource.attributes = params[:resource]
    if @resource.save
      redirect_to eval("admin_#{@element.class.name.singularize.downcase}_resources_path(@element)"), :flash => {:success => 'Resource has been created successfully'}
    else
      render :action => 'index'
    end
  end

  def destroy
    @resource = @element.resources.find(params[:id])
    @resource.destroy
    redirect_to eval("admin_#{@element.class.name.singularize.downcase}_resources_path(@element)"), :flash => {:success => 'Resource has been destroyed successfully'}
  end

  private

    def set_element
      if params[:project_id]
        @element = @project = current_user.admin? ?
            Project.find(params[:project_id]) :
            current_user.organization.projects.find(params[:project_id])
      elsif params[:organization_id]
        @element = @organization = current_user.admin? ?
            Organization.find(params[:organization_id]) :
            current_user.organization
      elsif params[:site_id]
        @element = @site = Site.find(params[:site_id]) if current_user.admin?
      end
    end

end
