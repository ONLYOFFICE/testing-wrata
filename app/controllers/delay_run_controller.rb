class DelayRunController < ApplicationController
  before_action :manager

  def index
    @client_runs = Runner::Application.config.delayed_runs.get_client_runs(@client)
    render layout: false
  end

  def add_run
    @run = Runner::Application.config.delayed_runs.add_run(params, @client)

    render layout: false
  end

  def change_run
    Runner::Application.config.delayed_runs.change_run(params)

    render body: nil
  end

  def delete_run
    Runner::Application.config.delayed_runs.delete_run(params['id'])

    render body: nil
  end

  def add_delayed_row
    return render json: { errors: 'You cannot add delay run if you have no test lists' } if @client.test_lists.empty?
    render layout: false
  end

  private

  def manager
    if @client
      @manager = Runner::Application.config.run_manager.find_manager_by_client_login(@client.login)
    else
      flash[:empty_pages] = 'You need be authorized' # Not quite right!
      render signin_path
    end
  end

  def delayed_run_params
    params.require(:delayed_run).permit(:name, :f_type, :method, :client_id, :start_time, :next_start)
  end
end
