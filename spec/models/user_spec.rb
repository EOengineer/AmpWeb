# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    it "is valid with email and password" do
      expect(build(:user)).to be_valid
    end

    it "requires an email" do
      user = build(:user, email: "")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end

    it "requires a password" do
      user = build(:user, password: nil, password_confirmation: nil)
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "requires a unique email" do
      create(:user, email: "taken@example.com")
      duplicate = build(:user, email: "taken@example.com")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to be_present
    end
  end

  describe "confirmable" do
    it "is not active for authentication until confirmed" do
      user = create(:user)
      expect(user).not_to be_confirmed
      expect(user).not_to be_active_for_authentication
    end

    it "is active for authentication when confirmed" do
      user = create(:user, :confirmed)
      expect(user).to be_confirmed
      expect(user).to be_active_for_authentication
    end
  end

  describe "lockable" do
    it "is locked when the locked trait is applied" do
      user = create(:user, :locked)
      expect(user).to be_access_locked
      expect(user).not_to be_active_for_authentication
    end

    it "locks after too many failed attempts" do
      user = create(:user, :confirmed)

      Devise.maximum_attempts.times do
        user.valid_for_authentication? { false }
      end

      expect(user.reload).to be_access_locked
    end
  end
end
