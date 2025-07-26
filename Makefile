.PHONY: claude-setup setup-role claude-run workspace pr

claude-setup:
	./scripts/setup-claude-container.sh

setup-role:
	./scripts/setup-claude-role.sh

claude-run: claude-setup setup-role
	@if [ -n "$$TMUX" ] && [ -n "$$ROLE" ]; then \
		tmux rename-window "$$ROLE"; \
	fi
	docker-compose run --rm claude-code

workspace: claude-run

pr:
	./scripts/create-pr-auto.sh
