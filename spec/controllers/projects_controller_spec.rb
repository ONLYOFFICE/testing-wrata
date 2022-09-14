# frozen_string_literal: true

require 'rails_helper'

# This spec was generated by rspec-rails when you ran the scaffold generator.
# It demonstrates how one might use RSpec to specify the controller code that
# was generated by Rails when you ran the scaffold generator.
#
# It assumes that the implementation code is generated by the rails scaffold
# generator.  If you are using any extension libraries to generate different
# controller code, this generated spec may or may not pass.
#
# It only uses APIs available in rails and/or rspec-rails.  There are a number
# of tools you can use to make these specs even more expressive, but we're
# sticking to rails and rspec-rails APIs to keep things simple and stable.
#
# Compared to earlier versions of this generator, there is very limited use of
# stubs and message expectations in this spec.  Stubs are only used when there
# is no simpler way to get a handle on the object needed for the example.
# Message expectations are only used when there is no simpler way to specify
# that an instance is receiving a specific message.
#
# Also compared to earlier versions of this generator, there are no longer any
# expectations of assigns and templates rendered. These features have been
# removed from Rails core in Rails 5, but can be added back in via the
# `rails-controller-testing` gem.

RSpec.describe ProjectsController, type: :controller do
  # This should return the minimal set of attributes required to create a valid
  # Project. As you add validations to Project, be sure to
  # adjust the attributes here as well.
  let(:valid_attributes) do
    { name: 'ORGANIZATION/repo' }
  end

  let(:invalid_attributes) do
    { name: 'fake-name' * 100 }
  end

  # This should return the minimal set of values that should be in the session
  # in order to pass any filters (e.g. authentication) defined in
  # ProjectsController. Be sure to keep this updated too.
  let(:valid_session) { {} }

  describe 'GET #index' do
    it 'returns a success response' do
      project = Project.create! valid_attributes
      get :index, params: {}, session: valid_session
      expect(assigns(:projects)).to eq([project])
    end
  end

  describe 'GET #show' do
    it 'returns a success response' do
      project = Project.create! valid_attributes
      get :show, params: { id: project.to_param }, session: valid_session
      expect(assigns(:project)).to eq(project)
    end
  end

  describe 'GET #new' do
    it 'returns a success response' do
      get :new, params: {}, session: valid_session
      expect(assigns(:project)).to be_a(Project)
    end
  end

  describe 'GET #edit' do
    it 'returns a success response' do
      project = Project.create! valid_attributes
      get :edit, params: { id: project.to_param }, session: valid_session
      expect(assigns(:project)).to eq(project)
    end
  end

  describe 'POST #create' do
    context 'with valid params' do
      it 'creates a new Project' do
        expect do
          post :create, params: { project: valid_attributes }, session: valid_session
        end.to change(Project, :count).by(1)
      end

      it 'redirects to the created project' do
        post :create, params: { project: valid_attributes }, session: valid_session
        expect(response).to redirect_to(Project.last)
      end
    end

    context 'with invalid params' do
      it 'assigns a newly created but unsaved project as @project' do
        post :create, params: { project: invalid_attributes }, session: valid_session
        expect(assigns(:project)).to be_a_new(Project)
      end

      it "re-renders the 'new' template" do
        post :create, params: { project: invalid_attributes }, session: valid_session
        expect(response).to render_template('new')
      end
    end
  end

  describe 'PUT #update' do
    context 'with valid params' do
      let(:new_attributes) do
        { name: 'ANOTHER-ORG/another-repo' }
      end

      it 'updates the requested project' do
        project = Project.create! valid_attributes
        put :update, params: { id: project.to_param, project: new_attributes }, session: valid_session
        project.reload
        expect(project[:name]).to eq(new_attributes[:name])
      end

      it 'redirects to the project' do
        project = Project.create! valid_attributes
        put :update, params: { id: project.to_param, project: valid_attributes }, session: valid_session
        expect(response).to redirect_to(project)
      end
    end

    context 'with invalid params' do
      it 'assigns the project as @project' do
        project = Project.create! valid_attributes
        put :update, params: { id: project.to_param, project: invalid_attributes }, session: valid_session
        expect(assigns(:project)).to eq(project)
      end

      it "re-renders the 'edit' template" do
        project = Project.create! valid_attributes
        put :update, params: { id: project.to_param, project: invalid_attributes }, session: valid_session
        expect(response).to render_template('edit')
      end
    end
  end

  describe 'DELETE #destroy' do
    it 'destroys the requested project' do
      project = Project.create! valid_attributes
      expect do
        delete :destroy, params: { id: project.to_param }, session: valid_session
      end.to change(Project, :count).by(-1)
    end

    it 'redirects to the projects list' do
      project = Project.create! valid_attributes
      delete :destroy, params: { id: project.to_param }, session: valid_session
      expect(response).to redirect_to(projects_url)
    end
  end
end
