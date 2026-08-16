#### Build Docker images for local development

# Usage:
#   $ make up 	# docker compose up --build
#   $ make clean # docker compose down
####

# DOCKERHUB 
REGISTRY=ecoteldev
RELEASE_VERSION=release
STAGING_VERSION=staging
TEST_VERSION=test
CAMPHA_VERSION=campha
CAOSON_VERSION=caoson
TAG_VERSION=$(shell git describe --tags --abbrev=0)

## Get current branch & commit ID to save to .info file 
current_branch:=`git branch --show-current`
commit_id:=`git rev-parse --short=7 HEAD`


# Local build for development
up: clean build


# Common Docker compose build for local dev
build:
	@echo "<-----Branch info------>" >> .branch_info
	@echo "#Current Branch: ${current_branch}\r\n#Current Commit ID: ${commit_id}" >> .branch_info
	@echo "#Build at time: $(shell date +'%Y-%m-%d %H:%M:%S')" >> .branch_info
	docker compose up --build

# Docker compose build & publishing to Dockerhub for test
test:
	@echo "REGISTRY=${REGISTRY}\nVERSION=${TEST_VERSION}-${TAG_VERSION}-${commit_id}" > .env
	@echo "Docker compose build from a file..."
	docker compose -f docker-compose-build-test.yaml build \
		--parallel \
		--build-arg NGINX_CONF=nginx_test.conf
	@echo "Docker login with github secrets"
	echo "$$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	@echo "Docker compose push to a DockerHub image repository for test"
	docker compose -f docker-compose-build-test.yaml push

# Docker compose build & publishing to Dockerhub for campha
campha:
	@echo "REGISTRY=${REGISTRY}\nVERSION=${CAMPHA_VERSION}-${TAG_VERSION}-${commit_id}" > .env
	@echo "Docker compose build from a file..."
	docker compose -f docker-compose-build-campha.yaml build \
		--parallel \
		--build-arg NGINX_CONF=nginx_campha.conf
	@echo "Docker login with github secrets"
	echo "$$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	@echo "Docker compose push to a DockerHub image repository for campha"
	docker compose -f docker-compose-build-campha.yaml push

# Docker compose build & publishing to Dockerhub for caoson
caoson:
	@echo "REGISTRY=${REGISTRY}\nVERSION=${CAOSON_VERSION}-${TAG_VERSION}-${commit_id}" > .env
	@echo "Docker compose build from a file..."
	docker compose -f docker-compose-build-caoson.yaml build \
		--parallel \
		--build-arg NGINX_CONF=nginx_caoson.conf
	@echo "Docker login with github secrets"
	echo "$$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	@echo "Docker compose push to a DockerHub image repository for caoson"
	docker compose -f docker-compose-build-caoson.yaml push

# Staging
staging:
	@echo "REGISTRY=${REGISTRY}\nVERSION=${STAGING_VERSION}-${TAG_VERSION}-${commit_id}" > .env
	@echo "Docker compose build from a file..."
	docker compose -f docker-compose-build.yaml build \
		--parallel \
		--build-arg NGINX_CONF=nginx_staging.conf
	@echo "Docker login with github secrets"
	echo "$$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	@echo "Docker compose push to a DockerHub image repository for staging"
	docker compose -f docker-compose-build.yaml push

# Docker compose build & publishing to Dockerhub for release
release:
	@echo "REGISTRY=${REGISTRY}\nVERSION=${RELEASE_VERSION}-${TAG_VERSION}-${commit_id}" > .env
	@echo "Docker compose build from a file..."
	docker compose -f docker-compose-build.yaml build \
		--parallel \
		--build-arg NGINX_CONF=nginx_release.conf
	@echo "Docker login with github secrets"
	echo "$$DOCKER_HUB_ACCESS_TOKEN" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	@echo "Docker compose push to a DockerHub image repository for release"
	docker compose -f docker-compose-build.yaml push

# remove previous images and containers
clean:
	@echo "Docker compose down"
	docker compose down	

.PHONY: clean up release staging