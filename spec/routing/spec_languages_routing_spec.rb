require 'rails_helper'

RSpec.describe SpecLanguagesController, type: :routing do
  describe 'routing' do
    it 'routes to #index' do
      expect(get: '/spec_languages').to route_to('spec_languages#index')
    end

    it 'routes to #new' do
      expect(get: '/spec_languages/new').to route_to('spec_languages#new')
    end

    it 'routes to #show' do
      expect(get: '/spec_languages/1').to route_to('spec_languages#show', id: '1')
    end

    it 'routes to #edit' do
      expect(get: '/spec_languages/1/edit').to route_to('spec_languages#edit', id: '1')
    end

    it 'routes to #create' do
      expect(post: '/spec_languages').to route_to('spec_languages#create')
    end

    it 'routes to #update via PUT' do
      expect(put: '/spec_languages/1').to route_to('spec_languages#update', id: '1')
    end

    it 'routes to #update via PATCH' do
      expect(patch: '/spec_languages/1').to route_to('spec_languages#update', id: '1')
    end

    it 'routes to #destroy' do
      expect(delete: '/spec_languages/1').to route_to('spec_languages#destroy', id: '1')
    end
  end
end
