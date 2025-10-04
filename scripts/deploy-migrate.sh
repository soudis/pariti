#!/bin/bash

# Deploy up script for Pariti application
# Usage: ./deploy-up.sh <deployment_name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 <deployment_name>"
    echo ""
    echo "Available deployments:"
    if [ -d "deployments" ]; then
        for deployment in deployments/*/; do
            if [ -d "$deployment" ]; then
                local name=$(basename "$deployment")
                echo "  - $name"
            fi
        done
    else
        echo "  No deployments found."
    fi
    echo ""
    echo "To create a new deployment, run:"
    echo "  npm run docker:deploy:create"
}

# Function to check if deployment exists
deployment_exists() {
    local deployment_name="$1"
    [ -d "deployments/$deployment_name" ] && [ -f "deployments/$deployment_name/docker-compose.yml" ] && [ -f "deployments/$deployment_name/.env" ]
}

# Function to get deployment info
get_deployment_info() {
    local deployment_name="$1"
    local info_file="deployments/$deployment_name/deployment-info.txt"
    
    if [ -f "$info_file" ]; then
        echo "Deployment Information:"
        echo "====================="
        cat "$info_file"
        echo ""
    fi
}

# Function to deploy the application
deploy_application() {
    local deployment_name="$1"
    local deployment_dir="deployments/$deployment_name"
    local compose_file="$deployment_dir/docker-compose.yml"
    local env_file="$deployment_dir/.env"
    
    print_status "Deploying '$deployment_name'..."
    
    # Check if files exist
    if [ ! -f "$compose_file" ]; then
        print_error "Docker Compose file not found: $compose_file"
        exit 1
    fi
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$env_file"
    set +a
    
    # Set DOCKER_HOST if specified
    if [ -n "$DOCKER_HOST" ]; then
        print_status "Using Docker Host: $DOCKER_HOST"
        export DOCKER_HOST
    fi
    
    # Build docker compose command
    local compose_cmd="docker compose -f $compose_file --env-file $env_file"
    
    print_status "Migrating database..."
    eval "$compose_cmd run --user root npx prisma migrate deploy"
    
    print_success "Deployment '$deployment_name' migrated successfully!"
    
    # Show deployment info
    get_deployment_info "$deployment_name"
    
    # Show useful commands
    echo ""
    print_status "Useful commands:"
    echo "  View logs: $compose_cmd logs -f"
    echo "  Stop services: $compose_cmd down"
    echo "  Restart services: $compose_cmd restart"
    echo "  View status: $compose_cmd ps"
    
    # Show service URLs if available
    if [ -n "$DOMAIN" ]; then
        echo ""
        print_status "Service URLs:"
        echo "  Application: https://$DOMAIN"
        if [ "$PROXY_NETWORK" = "traefik_network" ]; then
            echo "  Traefik Dashboard: http://localhost:8080"
        fi
    fi
}

# Main script logic
main() {
    # Check if docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running!"
        exit 1
    fi
    
    # Check if docker compose is available
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available!"
        exit 1
    fi
    
    # Check arguments
    if [ $# -eq 0 ]; then
        print_error "Deployment name is required!"
        echo ""
        show_usage
        exit 1
    fi
    
    local deployment_name="$1"
    
    # Validate deployment name
    if [ -z "$deployment_name" ]; then
        print_error "Deployment name cannot be empty!"
        echo ""
        show_usage
        exit 1
    fi
    
    # Check if deployment exists
    if ! deployment_exists "$deployment_name"; then
        print_error "Deployment '$deployment_name' not found!"
        echo ""
        show_usage
        exit 1
    fi
    
    # Deploy the application
    deploy_application "$deployment_name"
}

# Run main function with all arguments
main "$@"
