# frozen_string_literal: true

# Idempotent seeds for local development (also run from bin/docker-entrypoint).

if Rails.env.development?
  user = User.find_or_initialize_by(email: "test@example.com")
  user.password = "Password1234!"
  user.password_confirmation = "Password1234!"

  # Satisfy Devise :confirmable — confirmed, no pending email change
  user.skip_confirmation_notification!
  user.confirmed_at = Time.current
  user.confirmation_token = nil
  user.confirmation_sent_at = nil
  user.unconfirmed_email = nil

  # Satisfy Devise :lockable — unlocked, clean attempt counter
  user.locked_at = nil
  user.unlock_token = nil
  user.failed_attempts = 0

  user.save!
end
