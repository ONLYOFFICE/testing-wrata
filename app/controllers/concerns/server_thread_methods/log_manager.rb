# frozen_string_literal: true

module ServerThreadMethods
  module LogManager
    # @return [Integer] show how much of last log shown
    LAST_LINES_COUNT = 60

    def log_file_empty?
      if log_file_exist?
        File.empty?(@server_model.log_path)
      else
        true
      end
    end

    def log_file_exist?
      File.exist? @server_model.log_path
    end

    def clear_log_file
      @log = ''
      File.write(@server_model.log_path, '') if log_file_exist?
    end

    def delete_log_file
      File.delete(@server_model.log_path) if log_file_exist?
    end

    def create_log_scan_thread
      @log_scan_thread = Thread.new(caller: method(__method__).owner.to_s) do
        loop do
          Thread.stop unless @test # Stop Thread if test was ended
          last_log_data                                 # check each TIME_FOR_UPDATE new log
          sleep TIME_FOR_UPDATE                         #
        end
      end
    end

    def start_log_scan_thread
      if @log_scan_thread.alive?
        @log_scan_thread.run if @log_scan_thread.stop?
      else
        create_log_scan_thread
      end
    end

    def last_log_data
      if log_file_empty?
        @log = ''
      else
        lines = read_log
        @log = lines.last(LAST_LINES_COUNT).join
      end
    end

    def full_log
      return read_log.join if log_file_exist?

      ''
    end

    private

    # @return [Array<String>] server log for current thread
    def read_log
      @server_model.log.lines
    rescue *ServerTestOut::LOG_READ_FAILURE_EXCEPTIONS => e
      Rails.logger.warn("Read file #{@server_model.log_path} is failed with #{e}")
      ['']
    end
  end
end
