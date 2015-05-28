class ServersController < ApplicationController
  EXECUTOR_IMAGE_NAME = 'nct-at-stable'

  before_action :create_digital_ocean, only: [:cloud_server_create, :cloud_server_destroy]

  # GET /test_lists
  # GET /test_lists.json
  def index
    @servers = Server.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @servers }
    end
  end

  # GET /clients/1
  # GET /clients/1.json
  def show
    @server = Server.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @server }
    end
  end

  # GET /servers/new
  def new
    @server = Server.new
  end

  # GET /servers/1/edit
  def edit
    @server = Server.find(params[:id])
  end

  def show_current_results
    server_thread = $threads.get_thread_by_name(params[:server])
    @rspec_result = server_thread.full_results_of_test
    @file_name = server_thread.test_name

    render 'histories/show_html_results', layout: false
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

    render layout: false
  end

  def reboot
    $threads.get_thread_by_name(params['server']).reboot

    render nothing: true
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
    @server = Server.new(params[:server])

    if @server.save
      $threads.add_threads
      redirect_to @server
    else
      render 'new'
    end
  end

  # PUT /clients/1
  # PUT /clients/1.json
  def update
    @server = Server.find(params[:id])

    respond_to do |format|
      if @server.update_attributes(params[:server])
        format.html { redirect_to @server, notice: 'Server was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: 'edit' }
        format.json { render json: @server.errors, status: :unprocessable_entity }
      end
    end
  end

  def cloud_server_create
    set_server_status(params['server'], :creating)
    begin
      @digital_ocean.restore_image_by_name(EXECUTOR_IMAGE_NAME, params['server'])
    rescue => e
      set_server_status(params['server'], :destroyed)
      raise e
    end
    @digital_ocean.wait_until_droplet_have_status(params['server'])
    new_address = @digital_ocean.get_droplet_ip_by_name(params['server'])
    update_server_ip(params['server'], new_address)
    set_server_status(params['server'], :created)
    render nothing: true
  end

  def destroy
    Server.find(params[:id]).destroy
    flash[:success] = "Server deleted"
    redirect_to servers_url
  end

  def cloud_server_destroy
    set_server_status(params['server'], :destroying)
    @digital_ocean.destroy_droplet_by_name(params['server'])
    set_server_status(params['server'], :destroyed)
    render nothing: true
  end

  private

  def create_digital_ocean
    @digital_ocean = DigitalOceanWrapper.new
  end

  def set_server_status(server_name, status)
    server = $threads.get_thread_by_name(server_name)
    server.server_model.update_attribute(:_status, status)
    $threads.update_models
  end

  def update_server_ip(server_name, new_address)
    server = Server.where(name: server_name).first
    server.update_attribute(:address, new_address)
  end
end
