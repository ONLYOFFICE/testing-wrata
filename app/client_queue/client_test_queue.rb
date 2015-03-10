class ClientTestQueue
  attr_accessor :tests

  # * param tests - array of tests
  def initialize(tests = [])
    @tests = tests
    @id = 0
  end

  def push_test(test_path, branch, location)
    test_name = get_name_from_path(test_path)
    test_project = get_project(test_path)
    doc_branch, tm_branch = get_branches(test_project, branch, location.split(' ')[0])
    @tests << { test_path: reformat_path(test_path), id: @id, doc_branch: doc_branch, tm_branch: tm_branch,
                location: location, test_name: test_name, project: test_project }
    @id += 1
  end

  def reformat_path(test_path)
    test_path.include?(HOME_DIRECTORY) ? test_path.gsub(HOME_DIRECTORY, '~') : test_path
  end

  def push_test_with_branches(test_path, tm_branch, doc_branch, location)
    test_name = get_name_from_path(test_path)
    test_project = get_project(test_path)
    @tests << { test_path: test_path, id: @id, doc_branch: doc_branch, tm_branch: tm_branch,
                location: location, test_name: test_name, project: test_project }
    @id += 1
  end

  def empty?
    @tests.empty?
  end

  def shift_test
    @tests.shift
  end

  def delete_test(test_id)
    test = @tests.select { |test| test[:id] == test_id }.first
    @tests.delete(test)
  end

  def swap_tests(test_id1, test_id2, in_start)
    test1 = @tests.select { |test| test[:id] == test_id1 }.first
    test1_index = @tests.index(test1)
    if in_start == 'true'
      elem = @tests.delete_at(test1_index)
      @tests.insert(0, elem)
    else
      test2 = @tests.select { |test| test[:id] == test_id2 }.first
      test2_index = @tests.index(test2)
      elem = @tests.delete_at(test1_index)
      @tests.insert(test2_index, elem)
    end
  end

  def change_test_location(test_id, new_location)
    test = @tests.find { |test| test[:id] == test_id }
    test[:location] = new_location
  end

  def clear
    @tests.clear
  end

  def get_name_from_path(test_path)
    test_path[(test_path.rindex('/') + 1)..-1]
  end

  def get_project(test_path)
    test_path.include?(DOCS_PROJECT_NAME) ? DOCS_TAB_NAME : TEAMLAB_TAB_NAME
  end

  def get_branches(project, branch, region)
    teamlab_branch = TEAMLAB_DEFAULT_BRANCH
    doc_branch = DOCS_DEFAULT_BRANCH
    if project == DOCS_TAB_NAME
      doc_branch = branch
      if region == INFO_SERVER
        teamlab_branch = TEAMLAB_INFO_MAIN_BRANCH
      elsif  region == COM_SERVER
        teamlab_branch = TEAMLAB_COM_MAIN_BRANCH
      end
    end
    if project == TEAMLAB_TAB_NAME
      teamlab_branch = branch
    end
    [doc_branch, teamlab_branch]
  end
end
#
# str = ' //home/runner/RubymineProjects/OnlineDocuments/RspecTest/Studio/run_test_single_spec.rb'
# p str.gsub("/#{ENV['HOME']}", '~')
