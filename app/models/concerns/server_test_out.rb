# frozen_string_literal: true

module ServerTestOut
  BEGIN_HTML_OUT = '-----BEGIN HTML OUTPUT-----'
  END_HTML_OUT = '-----END HTML OUTPUT-----'
  FINAL_MATCH_REGEXP = /#{BEGIN_HTML_OUT}(.*)#{END_HTML_OUT}/m
  # @return [Array<Exception>] list of exceptions happens on log read failure
  LOG_READ_FAILURE_EXCEPTIONS = [ArgumentError,
                                 Errno::ENOENT].freeze

  # @return [Stirng] path to log of server
  def log_path
    "tmp/node-#{name}.log"
  end

  # @return [String] html result in container
  def result_in_container
    "/var/www/html/#{name}.html"
  end

  # @return [String] command to ouput test result
  def output_result
    "echo '#{BEGIN_HTML_OUT}';" \
      "cat #{result_in_container};" \
      "echo #{END_HTML_OUT};"
  end

  # @return [String] log file content
  def log
    File.read(log_path).encode(Encoding.find('UTF-8'),
                               invalid: :replace,
                               undef: :replace,
                               replace: '')
  end

  # @return [String] get final result of test
  def final_result_html
    match = log.match(FINAL_MATCH_REGEXP)
    return '' unless match

    match[1]
  rescue *ServerTestOut::LOG_READ_FAILURE_EXCEPTIONS => e
    Rails.logger.error("Could not read full log: #{e}")
    ''
  end

  # Add data to log if force stopped
  # @param result [String] current html result
  # @return [Nothing]
  def force_stop_log_append(result)
    File.open(log_path, 'a+') do |f|
      f << ServerTestOut::BEGIN_HTML_OUT
      f << result.dup.force_encoding('UTF-8')
      f << ServerTestOut::END_HTML_OUT
      f << History::FORCE_STOP_LOG_ENTRY
    end
  end
end
