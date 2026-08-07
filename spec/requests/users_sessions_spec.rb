# frozen_string_literal: true

require "rails_helper"

RSpec.describe "User sessions", type: :request do
  let(:password) { "password123" }

  it "signs in a confirmed user" do
    user = create(:user, :confirmed, password: password, password_confirmation: password)

    post user_session_path, params: { user: { email: user.email, password: password } }

    expect(response).to redirect_to(gear_path)
    follow_redirect!
    expect(response.body).to include(user.email)
    expect(response.body).to include("data-controller=\"audio-io\"")
  end

  it "does not sign in an unconfirmed user" do
    user = create(:user, password: password, password_confirmation: password)

    post user_session_path, params: { user: { email: user.email, password: password } }

    expect(response).to redirect_to(new_user_session_path)
    follow_redirect!
    expect(response.body).to include("Sign in")
    expect(response.body).not_to include("Sign out")
  end

  it "signs out a signed-in user" do
    user = create(:user, :confirmed)
    sign_in user

    delete destroy_user_session_path

    expect(response).to redirect_to(root_path)
    follow_redirect!
    expect(response.body).to include("Sign in")
  end
end
