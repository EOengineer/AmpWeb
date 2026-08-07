# frozen_string_literal: true

require "rails_helper"

RSpec.describe "User registrations", type: :request do
  before { ActionMailer::Base.deliveries.clear }

  it "creates an unconfirmed user and sends a confirmation email" do
    expect {
      post user_registration_path, params: {
        user: {
          email: "new@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }
    }.to change(User, :count).by(1)
      .and change { ActionMailer::Base.deliveries.count }.by(1)

    user = User.find_by!(email: "new@example.com")
    expect(user).not_to be_confirmed
    expect(response).to redirect_to(root_path)

    mail = ActionMailer::Base.deliveries.last
    expect(mail.to).to eq([ "new@example.com" ])
    expect(mail.subject).to match(/confirmation/i)
  end
end
