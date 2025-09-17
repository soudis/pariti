#!/bin/bash

# Deploy script for Pariti application
# Usage: ./deploy.sh [nginx|traefik]

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

# Function to generate a secure random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
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

# Function to validate email format
validate_email() {
    local email="$1"
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate domain format
validate_domain() {
    local domain="$1"
    if [[ $domain =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to create .env.docker file
create_env_file() {
    local proxy_type=$1
    local env_file="docker/.env.docker"
    
    print_status "Creating .env.docker file..."
    
    # Generate a secure database password
    local db_password=$(generate_password)
    
    # Set proxy network based on type
    local proxy_network
    if [ "$proxy_type" = "nginx" ]; then
        proxy_network="nginx_network"
    elif [ "$proxy_type" = "traefik" ]; then
        proxy_network="traefik_network"
    elif [ "$proxy_type" = "custom" ]; then
        proxy_network="$PROXY_NETWORK_CUSTOM"
    else
        print_error "Unknown proxy type: $proxy_type"
        exit 1
    fi
    
    # Prompt for domain
    local domain
    while true; do
        domain=$(prompt_for_input "Enter your domain name (e.g., example.com)" "")
        if validate_domain "$domain"; then
            break
        else
            print_error "Invalid domain format. Please enter a valid domain name."
        fi
    done
    
    # Prompt for admin email
    local admin_email
    while true; do
        admin_email=$(prompt_for_input "Enter admin email for Let's Encrypt certificates" "")
        if validate_email "$admin_email"; then
            break
        else
            print_error "Invalid email format. Please enter a valid email address."
        fi
    done
    
    # Create the .env.docker file
    cat > "$env_file" << EOF
# Database Configuration
DATABASE_USERNAME=pariti_user
DATABASE_NAME=pariti_db
DATABASE_PASSWORD=$db_password

# Domain Configuration
DOMAIN=$domain

# Timezone
TZ=Europe/Berlin

# Admin Email (for Let's Encrypt)
ADMIN_EMAIL=$admin_email

# Compose Project Name
COMPOSE_PROJECT_NAME=pariti

# Proxy Network
PROXY_NETWORK=$proxy_network
EOF
    
    print_success "Created $env_file with generated database password"
    print_success "Domain: $domain"
    print_success "Admin Email: $admin_email"
}

# Function to deploy with docker compose
deploy_compose() {
    local proxy_type=$1
    local compose_file="docker/compose.yml"
    
    print_status "Deploying with $proxy_type configuration..."
    
    # Change to docker directory
    cd docker
    
    # Build docker compose command based on proxy type
    local compose_cmd="docker compose -f compose.yml --env-file .env.docker"
    
    if [ "$proxy_type" = "custom" ]; then
        # For custom proxy, only use base compose file
        print_status "Using custom proxy network: $PROXY_NETWORK_CUSTOM"
        print_status "Running: $compose_cmd up -d"
    else
        # For predefined proxy types, use override file
        local override_file="compose.override.${proxy_type}.yml"
        
        # Check if override file exists
        if [ ! -f "$override_file" ]; then
            print_error "Override file $override_file not found!"
            exit 1
        fi
        
        compose_cmd="$compose_cmd -f $override_file"
        print_status "Running: $compose_cmd up -d"
    fi
    
    # Deploy with docker compose
    eval "$compose_cmd up -d"
    
    print_success "Deployment completed successfully!"
    print_status "Application is running with $proxy_type proxy"
    
    # Show some useful information
    echo ""
    print_status "Useful commands:"
    if [ "$proxy_type" = "custom" ]; then
        echo "  View logs: $compose_cmd logs -f"
        echo "  Stop services: $compose_cmd down"
        echo "  Restart services: $compose_cmd restart"
    else
        echo "  View logs: $compose_cmd logs -f"
        echo "  Stop services: $compose_cmd down"
        echo "  Restart services: $compose_cmd restart"
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
        print_status "No proxy type specified. You can either:"
        echo "  1. Use a predefined proxy type: nginx or traefik"
        echo "  2. Use a custom proxy network name"
        echo ""
        
        local choice
        while true; do
            choice=$(prompt_for_input "Choose option (1 for predefined, 2 for custom)" "1")
            if [ "$choice" = "1" ] || [ "$choice" = "2" ]; then
                break
            else
                print_error "Please enter 1 or 2"
            fi
        done
        
        if [ "$choice" = "1" ]; then
            local proxy_type
            while true; do
                proxy_type=$(prompt_for_input "Enter proxy type (nginx or traefik)" "")
                if [ "$proxy_type" = "nginx" ] || [ "$proxy_type" = "traefik" ]; then
                    break
                else
                    print_error "Invalid proxy type. Must be either 'nginx' or 'traefik'"
                fi
            done
        else
            # Custom proxy network
            local custom_network
            while true; do
                custom_network=$(prompt_for_input "Enter custom proxy network name" "")
                if [ -n "$custom_network" ]; then
                    break
                else
                    print_error "Proxy network name cannot be empty"
                fi
            done
            # Set proxy_type to "custom" and store the network name
            proxy_type="custom"
            PROXY_NETWORK_CUSTOM="$custom_network"
        fi
    else
        local proxy_type=$1
        
        # Validate proxy type
        if [ "$proxy_type" != "nginx" ] && [ "$proxy_type" != "traefik" ]; then
            print_error "Invalid proxy type: $proxy_type"
            print_error "Must be either 'nginx' or 'traefik'"
            exit 1
        fi
    fi
    
    print_status "Starting deployment with $proxy_type configuration..."
    
    # Create environment file
    create_env_file "$proxy_type"
    
    # Deploy
    deploy_compose "$proxy_type"
}

# Run main function with all arguments
main "$@"
