# frozen_string_literal: true

require 'open-uri'

module ServerThreadMethods
  module HtmlResultManager
    # @return [Array, Exception] exceptions which may occur if something wrong with reading status
    READ_STATUS_EXCEPTIONS = [EOFError,
                              Errno::ECONNREFUSED,
                              Errno::ECONNRESET,
                              Errno::EHOSTUNREACH,
                              Net::OpenTimeout,
                              Net::ReadTimeout].freeze

    def result_url
      "http://#{@server_model.address}/#{@server_model.name}.html"
    end

    def html_progress_exist?
      url = URI.parse(result_url)
      req = Net::HTTP.new(url.host, url.port)
      res = req.request_head(url.path)
      res.code == '200'
    rescue *READ_STATUS_EXCEPTIONS
      false
    end

    def save_to_html
      " --format HtmlWithPassedTime -o #{@server_model.result_in_container}"
    end

    def read_progress
      return '' unless html_progress_exist?

      URI.open(result_url, &:read)
    rescue *READ_STATUS_EXCEPTIONS => e
      Rails.logger.warn("read_progress of #{@server_model.name} is failed with #{e}")
      ''
    end

    # @return [OnlyofficeRspecResultParser::RspecResult] metadata of test
    def test_metadata
      OnlyofficeRspecResultParser::ResultParser.parse_metadata(read_progress) if @test && html_progress_exist?
    end

    def create_progress_scan_thread
      @progress_scan_thread = Thread.new(caller: method(__method__).owner.to_s) do
        loop do
          Thread.stop unless @test
          @test_metadata = test_metadata
          sleep TIME_FOR_UPDATE
        end
      end
    end

    def start_progress_scan_thread
      if @progress_scan_thread.alive?
        @progress_scan_thread.run if @progress_scan_thread.stop?
      else
        create_progress_scan_thread
      end
    end

    def full_results_of_test
      results = nil
      if @test && html_progress_exist?
        begin
          results = OnlyofficeRspecResultParser::ResultParser.parse_rspec_html(read_progress)
        rescue StandardError => e
          Rails.logger.error e.message
          Rails.logger.error e.backtrace.join("\n")
          results = nil
        end
      end
      results
    end
  end
end
