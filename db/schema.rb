# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170309190312) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "clients", force: :cascade do |t|
    t.string   "login"
    t.string   "password"
    t.string   "first_name"
    t.string   "second_name"
    t.string   "post"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "password_digest"
    t.string   "remember_token"
    t.string   "project"
    t.boolean  "verified",        default: false
    t.index ["remember_token"], name: "index_clients_on_remember_token", using: :btree
  end

  create_table "delayed_runs", force: :cascade do |t|
    t.string   "f_type"
    t.datetime "start_time"
    t.string   "name"
    t.string   "method"
    t.integer  "client_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "location"
    t.datetime "next_start"
  end

  create_table "histories", force: :cascade do |t|
    t.string   "file"
    t.integer  "server_id"
    t.integer  "client_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "log"
    t.binary   "data"
    t.string   "total_result"
    t.datetime "start_time"
  end

  create_table "servers", force: :cascade do |t|
    t.string   "name"
    t.text     "description"
    t.string   "address"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "comp_name"
    t.string   "_status",               default: "destroyed"
    t.integer  "book_client_id"
    t.datetime "last_activity_date"
    t.boolean  "executing_command_now", default: false
    t.boolean  "self_destruction",      default: true
    t.string   "size",                  default: "1gb"
  end

  create_table "start_options", force: :cascade do |t|
    t.string  "docs_branch"
    t.string  "teamlab_branch"
    t.string  "shared_branch"
    t.string  "teamlab_api_branch"
    t.string  "portal_type"
    t.string  "portal_region"
    t.text    "start_command"
    t.integer "history_id"
  end

  create_table "strokes", force: :cascade do |t|
    t.string   "name"
    t.integer  "number"
    t.integer  "test_file_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "test_files", force: :cascade do |t|
    t.string   "name"
    t.integer  "test_list_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "test_lists", force: :cascade do |t|
    t.string   "name"
    t.integer  "client_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "branch"
    t.string   "project"
  end

end
