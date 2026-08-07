require "sidekiq/web"

Rails.application.routes.draw do
  devise_for :users
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  # Sidekiq dashboard (open in development — lock down before any shared deploy)
  mount Sidekiq::Web => "/sidekiq"

  root "pages#home"
end
