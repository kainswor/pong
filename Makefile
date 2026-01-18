.PHONY: build run run-debug clean help

# Docker image name
IMAGE_NAME := pong
CONTAINER_NAME := pong-container
HOST_PORT := 8080
CONTAINER_PORT := 80

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker image
	@echo "Building Docker image..."
	docker build -t $(IMAGE_NAME) .
	@echo "Build complete!"

run: ## Run the container on localhost:8080
	@echo "Starting container..."
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(HOST_PORT):$(CONTAINER_PORT) \
		--rm \
		$(IMAGE_NAME)
	@echo "Container running on http://localhost:$(HOST_PORT)"
	@echo "Use 'make stop' to stop the container"

run-debug: ## Run the container with verbose debug mode
	@echo "Starting container in debug mode..."
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(HOST_PORT):$(CONTAINER_PORT) \
		--rm \
		-e NGINX_DEBUG=1 \
		$(IMAGE_NAME) \
		sh -c "nginx -V && nginx -t -c /etc/nginx/nginx.conf && nginx -g 'daemon off; error_log /dev/stderr debug;'"
	@echo "Container running in debug mode on http://localhost:$(HOST_PORT)"
	@echo "Use 'make stop' to stop the container"
	@echo "Use 'make logs' to view debug logs"

stop: ## Stop and remove the running container
	@echo "Stopping container..."
	-docker stop $(CONTAINER_NAME)
	@echo "Container stopped"

logs: ## View container logs
	docker logs -f $(CONTAINER_NAME)

clean: ## Remove the Docker image
	@echo "Removing Docker image..."
	-docker rmi $(IMAGE_NAME)
	@echo "Clean complete!"

rebuild: clean build ## Rebuild the Docker image from scratch
