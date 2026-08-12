# codex-rebuild — patch + repackage the Codex desktop app
#
# Targets:
#   make setup      install tooling deps (electron, packager, asar, ...)
#   make resources  fetch + verify pinned public artifacts and assemble
#                   build/resources/ (codex CLI, node runtime, ripgrep) on
#                   top of the vendored payload
#   make check      acquire base app, apply patches, verify against golden
#   make rebuild    check + swap(work->forge) + package + extract dev app
#   make package    check + package only (no swap)
#   make clean      remove the assembled build/ and tmp work copy

NPM       ?= npm
NODE      ?= node
TOOLING   := tooling
MAKEFLAGS += --no-print-directory

.PHONY: setup resources check rebuild package clean

setup:
	cd $(TOOLING) && $(NPM) install

# Assemble the staged resources/ payload from vendor/ + pinned downloads.
# build/resources/ is what NATIVE_RESOURCES points at by default.
resources:
	cd $(TOOLING) && $(NODE) prepare-resources.cjs

# Default check: just apply patches against the base and verify golden match.
check:
	cd $(TOOLING) && $(NODE) rebuild.cjs

# Full rebuild: prepare resources, apply patches, swap work->forge, package.
rebuild:
	cd $(TOOLING) && $(NODE) rebuild.cjs --rebuild

# Package-only (no swap into forge-project).
package:
	cd $(TOOLING) && $(NODE) rebuild.cjs --package

clean:
	rm -rf build forge-project/out codex-rebuild-work
