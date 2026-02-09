.PHONY: dev build deploy test docker-build

dev:
	npx next dev

build:
	NEXT_PRIVATE_WORKER_THREADS=0 npx next build

deploy:
	bash deploy.sh

test:
	@echo "Testing clawer.ai endpoint..."
	@curl -s https://clawer.ai/ -o /dev/null -w 'HTTP %{http_code}\n'

docker-build:
	cd docker/openclaw-user && docker build -t clawer-openclaw:ecommerce .
