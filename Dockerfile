# syntax=docker/dockerfile:1
# Development image for AmpWeb — used by docker compose

ARG RUBY_VERSION=3.4.10
FROM docker.io/library/ruby:${RUBY_VERSION}-slim

WORKDIR /rails

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      curl \
      git \
      libpq-dev \
      libvips \
      libyaml-dev \
      pkg-config \
      postgresql-client \
      python-is-python3 \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives

ARG NODE_VERSION=20.19.2
ENV PATH=/usr/local/node/bin:$PATH
RUN curl -fsSL https://github.com/nodenv/node-build/archive/master.tar.gz | tar xz -C /tmp && \
    /tmp/node-build-master/bin/node-build "${NODE_VERSION}" /usr/local/node && \
    rm -rf /tmp/node-build-master && \
    corepack enable

ENV BUNDLE_PATH="/usr/local/bundle" \
    RAILS_ENV="development" \
    BOOTSNAP_CACHE_DIR="/rails/tmp/cache/bootsnap"

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY . .

RUN yarn build:css

EXPOSE 3000

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
