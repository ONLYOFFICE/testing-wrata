# frozen_string_literal: true

class DelayRunController < ApplicationController
  before_action :manager

  def index
    @client_runs = Runner::Application.config.delayed_runs.get_client_runs(current_client)
    render layout: false
  end

  def add_run
    @run = Runner::Application.config.delayed_runs.add_run(params, current_client)

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
    if current_client.test_lists.empty?
      return render json: { errors: 'You cannot add delay run if you have no test lists' }
    end

    render layout: false
  end

  private

  def manager
    if current_client
      @manager = Runner::Application.config.run_manager.find_manager_by_client_login(current_client.login)
    else
      flash.now[:empty_pages] = t(:not_authorized_flash)
      render signin_path
    end
  end
end
