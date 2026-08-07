# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: "noreply@ampweb.local"
  layout "mailer"
end
