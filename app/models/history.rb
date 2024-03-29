# frozen_string_literal: true

# Model for entry in run spec history
# Have details of which file run, how test finished (with or without failrues) and etc
class History < ApplicationRecord
  FORCE_STOP_LOG_ENTRY = '-----TEST FORCE STOP-----'
  belongs_to :server
  belongs_to :client
  has_one :start_option

  # @return [True, False] check if test was stopped by command
  def force_stop?
    log.include?(FORCE_STOP_LOG_ENTRY)
  end

  # @return [True, False] check if
  # spec execution finished correctly, or something went wrong
  def spec_finished_correctly?
    return true if force_stop?
    return true if exit_code&.zero?

    total_result.include?('example')
  end

  # @return [True, False] if a single test executed via spec
  def spec_tests_executed?
    !total_result.start_with?('0 examples')
  end

  # Send mail notification if something went wrong
  def notify_failure
    TestResultMailer.spec_failed_email(self).deliver_now
  rescue StandardError => e
    Rails.logger.warn("[notify_failure] Sending `notify_failure` mail failed with: #{e}")
  end

  # Send mail notification if something went wrong
  def notify_empty_result
    TestResultMailer.spec_no_tests_executed_email(self).deliver_now
  rescue StandardError => e
    Rails.logger.warn("[notify_failure] Sending `notify_empty_result` mail failed with: #{e}")
  end

  # @return [String] time of test execution in minutes
  def elapsed_time
    return 'Unknown' if start_time.nil? || created_at.nil?

    "#{((created_at - start_time) / 60).round} Minutes"
  end

  # Send notification on spec finish
  def spec_finished_notifications
    if spec_finished_correctly?
      return if spec_tests_executed?

      notify_empty_result
    else
      notify_failure
    end
  end

  # @return [String] convert to log file format
  def to_log_file
    "Execution log for file: #{file}\n\n" \
      "#{log}\n\n"
  end

  # @return [String] filename for log file
  def log_filename
    "wrata-log-#{created_at.in_time_zone.strftime('%Y-%m-%d %H-%m-%s-%L %z')}.log"
  end
end
