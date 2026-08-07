# frozen_string_literal: true

# Wire Searchkick to OpenSearch for local Docker Compose.
# Domain models/indexing come later — this only establishes connectivity.
if defined?(Searchkick)
  Searchkick.client = OpenSearch::Client.new(
    url: ENV.fetch("OPENSEARCH_URL", "http://localhost:9200"),
    log: Rails.env.development?
  )
end
