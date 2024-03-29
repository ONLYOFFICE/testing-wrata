# frozen_string_literal: true

class QueueController < ApplicationController
  before_action :manager

  def book_server
    return head(:forbidden) unless able_to_be_booked?

    @manager.add_server(params['server'])

    render body: nil
  end

  def unbook_server
    @manager.delete_server(params['server'])

    render body: nil
  end

  def unbook_all_servers
    @manager.delete_all_servers

    render body: nil
  end

  def add_test
    add_single_test_from_params(params['test_path'], params)

    render body: nil
  end

  # Add several tests to queue
  # @return [Void]
  def add_tests
    params['test_paths'].each do |test_path|
      add_single_test_from_params(test_path, params)
    end
    render body: nil
  end

  def retest
    start_option = StartOption.find_by(id: params[:start_option_id])
    @manager.add_test(params['test_path'],
                      nil,
                      start_option.server_location,
                      to_begin_of_queue: true,
                      spec_browser: start_option.spec_browser,
                      spec_language: start_option.spec_language,
                      tm_branch: start_option.teamlab_branch,
                      doc_branch: start_option.docs_branch)

    render body: nil
  end

  def delete_test
    @manager.delete_test(params['test_id'].to_i)

    render body: nil
  end

  def clear_tests
    @manager.clear_test_queue

    render body: nil
  end

  def shuffle_tests
    @manager.shuffle_test

    render body: nil
  end

  def remove_duplicates
    @manager.remove_duplicates

    render body: nil
  end

  def clear_booked_servers
    @manager.clear_booked_servers

    render body: nil
  end

  def swap_tests
    @manager.swap_tests(params['test_id1'].to_i, params['test_id2'].to_i, params['in_start'])

    render body: nil
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

  # @return [true, false] is server able to be booked
  def able_to_be_booked?
    server = Server.find_by(name: params['server'])
    server.book_client_id.nil?
  end

  # Add only single test from params and it's name
  # @param [String] test_path path to test
  # @param [Hash] params list of all params
  # @return [Void]
  def add_single_test_from_params(test_path, params)
    @manager.add_test(test_path, params['branch'], params['location'],
                      to_begin_of_queue: true,
                      spec_browser: params['spec_browser'],
                      spec_language: params['spec_language'],
                      tm_branch: params['teamlab_branch'],
                      doc_branch: params['doc_branch'])
  end
end
