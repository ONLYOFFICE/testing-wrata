# frozen_string_literal: true

class AddColumnInServer < ActiveRecord::Migration[4.2]
  def change
    add_column :servers, :book_client_id, :integer
  end
end
