# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "password123" }
    password_confirmation { "password123" }

    trait :confirmed do
      confirmed_at { Time.current }
    end

    trait :locked do
      confirmed_at { Time.current }
      locked_at { Time.current }
      failed_attempts { Devise.maximum_attempts }
    end
  end
end
