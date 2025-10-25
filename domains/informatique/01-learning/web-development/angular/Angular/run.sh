#!/bin/bash

# Script de raccourci pour les scripts bash
# Usage: ./run.sh [script-name] [arguments]

SCRIPT_DIR="scripts/bash"
SCRIPT_NAME=${1:-"help"}

case "$SCRIPT_NAME" in
    dev|development)
        "$SCRIPT_DIR/dev.sh" "${@:2}"
        ;;
    test|testing)
        "$SCRIPT_DIR/test.sh" "${@:2}"
        ;;
    build|building)
        "$SCRIPT_DIR/build.sh" "${@:2}"
        ;;
    deploy|deployment)
        "$SCRIPT_DIR/deploy.sh" "${@:2}"
        ;;
    config|configuration)
        "$SCRIPT_DIR/config.sh" "${@:2}"
        ;;
    backup)
        "$SCRIPT_DIR/backup.sh" "${@:2}"
        ;;
    security)
        "$SCRIPT_DIR/security.sh" "${@:2}"
        ;;
    docs|documentation)
        "$SCRIPT_DIR/docs.sh" "${@:2}"
        ;;
    monitoring)
        "$SCRIPT_DIR/monitoring.sh" "${@:2}"
        ;;
    maintenance)
        "$SCRIPT_DIR/maintenance.sh" "${@:2}"
        ;;
    help|--help|-h)
        echo "Usage: $0 [script-name] [arguments]"
        echo ""
        echo "Available scripts:"
        echo "  dev          Development environment"
        echo "  test         Run tests"
        echo "  build        Build application"
        echo "  deploy       Deploy application"
        echo "  config       Configure environment"
        echo "  backup       Backup data"
        echo "  security     Security checks"
        echo "  docs         Generate documentation"
        echo "  monitoring   System monitoring"
        echo "  maintenance  Maintenance tasks"
        echo ""
        echo "Examples:"
        echo "  $0 dev"
        echo "  $0 test all"
        echo "  $0 deploy production"
        ;;
    *)
        echo "Unknown script: $SCRIPT_NAME"
        echo "Use '$0 help' to see available scripts"
        exit 1
        ;;
esac
