#!/bin/bash

# Deploy logs script for Pariti application
# Usage: ./deploy-logs.sh <deployment_name> [options]

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
    echo "Usage: $0 <deployment_name> [options]"
    echo ""
    echo "Options:"
    echo "  -f, --follow     Follow log output (default)"
    echo "  -n, --lines N    Number of lines to show from the end of logs"
    echo "  -s, --since T    Show logs since timestamp (e.g. 2023-01-01T00:00:00)"
    echo "  -t, --tail N     Number of lines to show from the end of logs (alias for --lines)"
    echo "  --no-follow      Don't follow log output"
    echo "  --service NAME   Show logs for specific service only"
    echo "  -h, --help       Show this help message"
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
    echo "Examples:"
    echo "  $0 production                    # Follow all logs"
    echo "  $0 production --no-follow       # Show recent logs and exit"
    echo "  $0 production --lines 100       # Show last 100 lines"
    echo "  $0 production --service next    # Show logs for 'next' service only"
    echo "  $0 production --since 1h        # Show logs from last hour"
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

# Function to show logs
show_logs() {
    local deployment_name="$1"
    local deployment_dir="deployments/$deployment_name"
    local compose_file="$deployment_dir/docker-compose.yml"
    local env_file="$deployment_dir/.env"
    
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
    
    # Check if services are running
    print_status "Checking deployment status..."
    local running_services
    running_services=$(eval "$compose_cmd ps --services --filter status=running" 2>/dev/null || echo "")
    
    if [ -z "$running_services" ]; then
        print_warning "No services are currently running for deployment '$deployment_name'"
        print_status "Available services:"
        eval "$compose_cmd config --services" 2>/dev/null || echo "  Could not determine services"
        echo ""
        print_status "To start the deployment, run:"
        echo "  npm run docker:deploy:up $deployment_name"
        exit 1
    fi
    
    print_status "Showing logs for deployment '$deployment_name'..."
    print_status "Running services: $running_services"
    echo ""
    
    # Build log command with options
    local log_cmd="$compose_cmd logs"
    
    if [ "$FOLLOW_LOGS" = "true" ]; then
        log_cmd="$log_cmd -f"
    fi
    
    if [ -n "$LINES" ]; then
        log_cmd="$log_cmd --tail $LINES"
    fi
    
    if [ -n "$SINCE" ]; then
        log_cmd="$log_cmd --since $SINCE"
    fi
    
    if [ -n "$SERVICE" ]; then
        log_cmd="$log_cmd $SERVICE"
    fi
    
    # Show deployment info
    get_deployment_info "$deployment_name"
    
    # Execute log command
    print_status "Executing: $log_cmd"
    echo ""
    
    eval "$log_cmd"
}

# Parse command line arguments
parse_arguments() {
    FOLLOW_LOGS="true"
    LINES=""
    SINCE=""
    SERVICE=""
    DEPLOYMENT_NAME=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--follow)
                FOLLOW_LOGS="true"
                shift
                ;;
            --no-follow)
                FOLLOW_LOGS="false"
                shift
                ;;
            -n|--lines|-t|--tail)
                LINES="$2"
                shift 2
                ;;
            -s|--since)
                SINCE="$2"
                shift 2
                ;;
            --service)
                SERVICE="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                print_error "Unknown option: $1"
                echo ""
                show_usage
                exit 1
                ;;
            *)
                if [ -z "$DEPLOYMENT_NAME" ]; then
                    DEPLOYMENT_NAME="$1"
                else
                    print_error "Multiple deployment names specified: $DEPLOYMENT_NAME and $1"
                    echo ""
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
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
    
    # Parse arguments
    parse_arguments "$@"
    
    # Check if deployment name is provided
    if [ -z "$DEPLOYMENT_NAME" ]; then
        print_error "Deployment name is required!"
        echo ""
        show_usage
        exit 1
    fi
    
    # Check if deployment exists
    if ! deployment_exists "$DEPLOYMENT_NAME"; then
        print_error "Deployment '$DEPLOYMENT_NAME' not found!"
        echo ""
        show_usage
        exit 1
    fi
    
    # Show logs
    show_logs "$DEPLOYMENT_NAME"
}

# Run main function with all arguments
main "$@"
