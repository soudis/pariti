#!/bin/bash

# Update script for Pariti application
# Usage: ./update.sh [nginx|traefik] [image-tag]

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

# Function to prompt for user input
prompt_for_input() {
    local prompt="$1"
    local default="$2"
    local value
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value=${value:-$default}
    else
        read -p "$prompt: " value
    fi
    
    echo "$value"
}

# Function to check if docker is running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running!"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available!"
        exit 1
    fi
}

# Function to check if deployment exists
check_deployment() {
    local proxy_type=$1
    local compose_file="docker/compose.yml"
    local env_file="docker/.env.docker"
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file $env_file not found!"
        print_error "Please run the initial deployment first using ./deploy.sh"
        exit 1
    fi
    
    # Check if containers are running
    cd docker
    local compose_cmd="docker compose -f compose.yml --env-file .env.docker"
    
    if [ "$proxy_type" != "custom" ]; then
        local override_file="compose.override.${proxy_type}.yml"
        if [ -f "$override_file" ]; then
            compose_cmd="$compose_cmd -f $override_file"
        fi
    fi
    
    # Check if any containers are running
    if ! eval "$compose_cmd ps -q" | grep -q .; then
        print_error "No running containers found for this deployment!"
        print_error "Please run the initial deployment first using ./deploy.sh"
        exit 1
    fi
    
    echo "$compose_cmd"
}

# Function to pull and update containers
update_containers() {
    local proxy_type=$1
    local image_tag=$2
    local compose_cmd=$3
    
    print_status "Starting update process..."
    
    # Pull the latest image
    print_status "Pulling latest image: soudis/pariti:$image_tag"
    if ! docker pull "soudis/pariti:$image_tag"; then
        print_error "Failed to pull image soudis/pariti:$image_tag"
        exit 1
    fi
    print_success "Successfully pulled image soudis/pariti:$image_tag"
    
    # Update the image tag in the compose file temporarily
    local temp_compose="compose.temp.yml"
    if [ "$image_tag" != "latest" ]; then
        print_status "Updating image tag to $image_tag"
        sed "s|soudis/pariti:latest|soudis/pariti:$image_tag|g" compose.yml > "$temp_compose"
        compose_cmd="docker compose -f $temp_compose --env-file .env.docker"
        
        if [ "$proxy_type" != "custom" ]; then
            local override_file="compose.override.${proxy_type}.yml"
            if [ -f "$override_file" ]; then
                compose_cmd="$compose_cmd -f $override_file"
            fi
        fi
    fi
    
    # Stop the application container (keep database running)
    print_status "Stopping application container..."
    eval "$compose_cmd stop next" || true
    
    # Remove the old application container
    print_status "Removing old application container..."
    eval "$compose_cmd rm -f next" || true
    
    # Start the application with the new image
    print_status "Starting application with new image..."
    eval "$compose_cmd up -d next"
    
    # Clean up temporary file
    if [ -f "$temp_compose" ]; then
        rm "$temp_compose"
    fi
    
    # Wait a moment for the container to start
    sleep 5
    
    # Check if the container is running
    if eval "$compose_cmd ps next" | grep -q "Up"; then
        print_success "Application updated successfully!"
        print_status "New image: soudis/pariti:$image_tag"
    else
        print_error "Failed to start the application with the new image!"
        print_status "Rolling back to previous version..."
        eval "$compose_cmd up -d next"
        exit 1
    fi
}

# Function to show update status
show_status() {
    local compose_cmd=$1
    
    print_status "Current deployment status:"
    eval "$compose_cmd ps"
    
    echo ""
    print_status "Application logs (last 20 lines):"
    eval "$compose_cmd logs --tail=20 next"
}

# Main script logic
main() {
    # Check if docker is available
    check_docker
    
    # Parse arguments
    local proxy_type=""
    local image_tag="latest"
    
    if [ $# -eq 0 ]; then
        print_status "No arguments provided. Interactive mode:"
        echo ""
        
        # Prompt for proxy type
        local choice
        while true; do
            choice=$(prompt_for_input "Choose deployment type (1: nginx, 2: traefik, 3: custom)" "1")
            if [ "$choice" = "1" ]; then
                proxy_type="nginx"
                break
            elif [ "$choice" = "2" ]; then
                proxy_type="traefik"
                break
            elif [ "$choice" = "3" ]; then
                proxy_type="custom"
                break
            else
                print_error "Please enter 1, 2, or 3"
            fi
        done
        
        # Prompt for image tag
        image_tag=$(prompt_for_input "Enter image tag to update to" "latest")
    else
        proxy_type=$1
        if [ $# -gt 1 ]; then
            image_tag=$2
        fi
    fi
    
    # Validate proxy type
    if [ "$proxy_type" != "nginx" ] && [ "$proxy_type" != "traefik" ] && [ "$proxy_type" != "custom" ]; then
        print_error "Invalid proxy type: $proxy_type"
        print_error "Must be either 'nginx', 'traefik', or 'custom'"
        exit 1
    fi
    
    print_status "Updating Pariti deployment..."
    print_status "Proxy type: $proxy_type"
    print_status "Image tag: $image_tag"
    echo ""
    
    # Check if deployment exists
    local compose_cmd
    compose_cmd=$(check_deployment "$proxy_type")
    
    # Show current status
    print_status "Current deployment status:"
    eval "$compose_cmd ps"
    echo ""
    
    # Confirm update
    local confirm
    confirm=$(prompt_for_input "Do you want to proceed with the update? (y/N)" "N")
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_status "Update cancelled by user"
        exit 0
    fi
    
    # Perform the update
    update_containers "$proxy_type" "$image_tag" "$compose_cmd"
    
    # Show final status
    echo ""
    show_status "$compose_cmd"
    
    echo ""
    print_success "Update completed successfully!"
    print_status "Useful commands:"
    echo "  View logs: $compose_cmd logs -f next"
    echo "  Check status: $compose_cmd ps"
    echo "  Restart if needed: $compose_cmd restart next"
}

# Run main function with all arguments
main "$@"
