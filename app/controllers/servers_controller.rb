class ServersController < ApplicationController

  before_action :create_digital_ocean, :only => [:create, :destroy]

  def show_current_results
    server_thread = $threads.get_thread_by_name(params[:server])
    @rspec_result = server_thread.get_full_results_of_test
    @file_name = server_thread.test_name

    render 'history/show_html_results', :layout => false
  end

  def clear_history
    server = Server.find_by_name(params[:server])
    history = server.histories
    history.delete_all

    render nothing: true
  end

  def show_more
    server = params['server']
    showed = params['showed']

    server = Server.find_by_name(server)
    @history = server.histories.order('created_at DESC').limit(10).offset(showed.to_i)
    @controller = :server

    render :layout => false
  end

  def reboot
    $threads.get_thread_by_name(params['server']).reboot

    render :nothing => true
  end

  def server_history
    server = Server.find_by_id(params[:id])
    @name = server.name
    @history = server.histories.order('created_at DESC').limit(10)
    @controller = :server
    respond_to do |format|
      format.html # history.erb
      format.json { render json: @history }
    end
  end

  def create
    set_server_status(params['server'], :creating)
    @digital_ocean.restore_image_by_name(params['server'])
    @digital_ocean.wait_until_droplet_have_status(params['server'])
    new_address = @digital_ocean.get_droplet_ip_by_name(params['server'])
    update_server_ip(params['server'], new_address)
    set_server_status(params['server'], :normal)
    render :nothing => true
  end

  def destroy
    set_server_status(params['server'], :destroying)
    @digital_ocean.destroy_droplet_by_name(params['server'])
    set_server_status(params['server'], :normal)
    render :nothing => true
  end

  private

  def create_digital_ocean
    @digital_ocean = DigitalOceanWrapper.new
  end

  def set_server_status(server_name, status)
    server = $threads.get_thread_by_name(server_name)
    server._status = status
  end

  def update_server_ip(server_name, new_address)
    server = Server.where(name: server_name).first
    server.update_attribute(:address, new_address)
    $threads.update_models
  end

end
