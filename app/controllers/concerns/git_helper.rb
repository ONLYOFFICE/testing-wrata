# frozen_string_literal: true

# Stuff for working with git
module GitHelper
  # List all branches in github repo
  # @param github_repo [String] repo to get branches
  # @return [Array, String] result of cleanup
  def get_list_branches(github_repo)
    branches = Rails.application.config.github_helper.branches(github_repo)
    promoted_master = promote_branch(branches, 'master')
    promote_branch(promoted_master, 'develop')
  rescue StandardError => e
    Rails.logger.error("Cannot get list of branches in #{github_repo} with #{e}")
    ['Unknown branch']
  end

  # Get list of tags in github repo
  # @param github_repo [String] repo to get tags
  # @return [Array, String] list of tags
  def get_tags(github_repo)
    Rails.application.config.github_helper.tags(github_repo)
  rescue StandardError => e
    Rails.logger.error("Cannot get list of tags in #{github_repo} with #{e}")
    ['Unknown tags']
  end

  private

  # Set branch in begin of list
  # @param branches [Array] list of branches
  # @param branch [String] branch to promote
  # @return [Array] with promoted
  def promote_branch(branches, branch)
    return branches unless branches.include?(branch)

    branches.delete branch
    branches.unshift branch
    branches
  end
end
