class Admin::OrganizationsController < ApplicationController

  before_filter :login_required

  def index
    @organizations = Organization.paginate :per_page => 20, :order => 'created_at DESC', :page => params[:page]
  end

  def new
    @organization = Organization.new
  end

  def create
    @organization = Organization.new(params[:organization])
    if @organization.save
      redirect_to edit_admin_organization_path(@organization), :flash => {:success => 'Organization has been created successfully'}
    else
      render :action => 'new'
    end
  end

  def specific_information
    @organization = Organization.find(params[:id])
    @site = @organization.sites.find(params[:site_id])
    @organization.attributes = @organization.attributes_for_site(@site.id)
  end

  def edit
    @organization = Organization.find(params[:id])
  end

  def update
    @organization = Organization.find(params[:id])
    if params[:site_id]
      if @site = @organization.sites.find(params[:site_id])
        @organization.attributes_for_site = params[:organization], params[:site_id]
      end
    else
      @organization.attributes = params[:organization]
    end
    if @organization.save
      redirect_to edit_admin_organization_path(@organization), :flash => {:success => 'Organization has been updated successfully'}
    else
      render :action => 'edit'
    end
  end

  def destroy
    @organization = Organization.find(params[:id])
    @organization.destroy
    redirect_to admin_organizations_path, :flash => {:success => 'Organization has been deleted successfully'}
  end

end
