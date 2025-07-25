.PHONY: claude-setup setup-instance claude-run claude pr

claude-setup:
	./scripts/setup-claude-container.sh

setup-instance:
	./scripts/setup-claude-instance.sh

claude-run: claude-setup setup-instance
	docker-compose run --rm claude-code

claude: claude-run

pr:
	./scripts/create-pr-auto.sh
