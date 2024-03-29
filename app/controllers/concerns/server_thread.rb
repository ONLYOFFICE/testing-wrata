# frozen_string_literal: true

class ServerThread
  include ServerThreadMethods::HistoryManager
  include ServerThreadMethods::HtmlResultManager
  include ServerThreadMethods::LogManager
  include ServerThreadMethods::PingManager
  include ServerThreadMethods::TestManager
  include ServerThreadMethods::ThreadManager

  attr_accessor :server_model, :_status, :ssh_pid, :log

  attr_reader :client

  TIME_FOR_UPDATE = 15

  def initialize(server_model)
    @server_model = server_model
    @client = server_model.booked_client
    @test = nil
    @_status = :normal
    @ssh_pid = nil
    create_main_thread
    start_pinging_server
    create_progress_scan_thread
    create_log_scan_thread
  end

  def free?
    @test ? false : true
  end

  def booked?
    @client ? true : false
  end

  def book_server(client)
    @client = client
    server_model.book(client)
  end

  def unbook_server
    @client = nil
    server_model.unbook
  end

  def start_test(test)
    @test = test
    @time_start = Time.zone.now
    start_progress_scan_thread
    start_log_scan_thread
    start_main_thread
  end

  def get_info_from_server(current_client, with_log: false)
    server_info = {}
    server_info[:name] = @server_model.name
    server_info[:test] = form_test_data(@test) if @test
    if @client && !@server_model.book_client_id.nil?
      server_info[:booked] = {
        booked_client: @client.login,
        booked_by_client: @client == current_client
      }
    end
    server_info[:status] = @status
    server_info[:last_activity_date] = @server_model.last_activity_date.to_s
    server_info[:_status] = @server_model._status
    server_info[:log] = @log if with_log
    server_info[:server_ip] = @server_model.address
    server_info[:size] = @server_model.size
    server_info
  end

  def testing_time
    Time.at(Time.now - @time_start).utc.strftime('%H:%M')
  end

  # Return inactive time of current server
  # @return [Float] time of server inactivity
  def inactive_time
    Time.current - @server_model.last_activity_date
  end

  # Check if current server should be self-destroyed
  # @return [True, False] condition for server destroy
  def should_be_destroyed?
    return false unless @server_model._status == :created
    return false unless @server_model.self_destruction
    return false if @server_model.executing_command_now
    return false if @server_model.last_activity_date.nil? # do not destroy if there is no data about last run

    inactive_time > destruction_timeout
  end

  def slice_project_path(file_name)
    file_name = file_name.slice((file_name.rindex('/') + 1)..-1)
    file_name = file_name[0..file_name.index(':')] if file_name.include?(':')
    file_name
  end

  def test_name
    return nil unless @test

    @test[:test_name]
  end

  private

  # Form test data by test info
  # @param [Hash] test data
  # @return [Hash] test data
  def form_test_data(test)
    {
      name: slice_project_path(test[:test_path]),
      location: test[:location],
      metadata: @test_metadata,
      time: testing_time,
      doc_branch: test[:doc_branch],
      tm_branch: test[:tm_branch],
      spec_browser: test[:spec_browser],
      spec_language: test[:spec_language]
    }
  end

  # @return [Integer] timeout after which server will be destroyed
  def destruction_timeout
    60 * 60
  end
end
