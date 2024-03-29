# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'projects/edit' do
  before do
    @project = assign(:project, Project.create!(
                                  name: 'MyString'
                                ))
  end

  it 'renders the edit project form' do
    render

    assert_select 'form[action=?][method=?]', project_path(@project), 'post' do
      assert_select 'input[name=?]', 'project[name]'
    end
  end
end
