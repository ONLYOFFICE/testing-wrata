# frozen_string_literal: true

Selenium::WebDriver.logger.level = :debug

describe 'custom portal name window', js: true do
  it 'calling custom portal name will show portal name input' do
    client = Client.create(login: 'user@example.com', password: 'password')
    visit '/sessions/new'
    fill_in('Login', with: client.login)
    fill_in('Password', with: client.password)
    click_button('Log in')
    select('custom', from: 'portal-list')
    expect(page).to have_selector('.bootbox', visible: :visible)
  end
end
