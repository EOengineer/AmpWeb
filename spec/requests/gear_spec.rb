# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Gear hub", type: :request do
  describe "GET /gear" do
    it "redirects guests to sign in" do
      get gear_path

      expect(response).to redirect_to(new_user_session_path)
    end

    it "renders the I/O panel and circuits placeholder for signed-in users" do
      user = create(:user, :confirmed)
      sign_in user

      get gear_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("data-controller=\"audio-io\"")
      expect(response.body).to include("Circuits coming soon")
      expect(response.body).to include("Gear")
    end

    it "does not expose a Gear nav link to guests on the public home page" do
      get root_path

      expect(response).to have_http_status(:ok)
      expect(response.body).not_to include('href="/gear"')
      expect(response.body).not_to include(">Gear</a>")
    end
  end
end
