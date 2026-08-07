# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Landing page", type: :request do
  it "renders the AmpWeb home page" do
    get root_path
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("AmpWeb")
  end
end
