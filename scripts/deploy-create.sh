#!/bin/bash

# Deploy creation script for Pariti application
# Usage: ./deploy-create.sh

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

# Function to validate deployment name
validate_deployment_name() {
    local name="$1"
    if [[ $name =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to create deployment directory and files
create_deployment() {
    local deployment_name="$1"
    local proxy_type="$2"
    local docker_host="$3"
    local deployment_dir="deployments/$deployment_name"
    
    print_status "Creating deployment '$deployment_name' with $proxy_type configuration..."
    
    # Create deployment directory
    mkdir -p "$deployment_dir"
    
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
    
    # Create the .env file
    local env_file="$deployment_dir/.env"
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
COMPOSE_PROJECT_NAME=pariti-$deployment_name

# Proxy Network
PROXY_NETWORK=$proxy_network

# Docker Host (optional)
DOCKER_HOST=$docker_host
EOF
    
    # Create the compose file
    local compose_file="$deployment_dir/docker-compose.yml"
    
    # Start with base compose file
    cat > "$compose_file" << EOF
services:
  next:
    image: soudis/pariti:latest
    restart: unless-stopped
    labels: # if using traefik
      - traefik.enable=true
      - traefik.http.routers.next.rule=Host(\`\${DOMAIN}\`)
      - traefik.http.routers.next.entrypoints=websecure
      - traefik.http.services.next.loadbalancer.server.port=3000
    environment:
      HOSTNAME: 0.0.0.0
      TZ: \${TZ:-Europe/Berlin}
      DATABASE_URL: postgres://\${DATABASE_USERNAME}:\${DATABASE_PASSWORD}@db:5432/\${DATABASE_NAME}?schema=public
      VIRTUAL_HOST: \${DOMAIN} # if using jwilder/nginx-proxy
      LETSENCRYPT_HOST: \${DOMAIN} # if using jrcs/letsencrypt-nginx-proxy-companion
    networks:
      - proxy_network
      - db_network
    command: node server.js

  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${DATABASE_USERNAME}
      POSTGRES_PASSWORD: \${DATABASE_PASSWORD}
      POSTGRES_DB: \${DATABASE_NAME}
      TZ: \${TZ:-Europe/Berlin}
    volumes:
      - db_data:/var/lib/postgresql/data/
    networks:
      - db_network

volumes:
  db_data:

networks:
  db_network:
  proxy_network:
    external: true
    name: \${PROXY_NETWORK}
EOF
    
    # Add proxy-specific services based on type
    if [ "$proxy_type" = "nginx" ]; then
        cat >> "$compose_file" << EOF

  nginx:
    image: jwilder/nginx-proxy
    restart: unless-stopped
    container_name: \${COMPOSE_PROJECT_NAME}-nginx
    volumes:
      - vhost:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
      - dhparam:/etc/nginx/dhparam
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - nginx-certificates:/etc/nginx/certs:ro      
    ports:
      - "80:80"
      - "443:443"
    networks:
      - proxy_network
    logging:
      options:
        max-size: 50m

  nginx-letsencrypt-companion:
    restart: unless-stopped
    image: jrcs/letsencrypt-nginx-proxy-companion
    volumes:
      - vhost:/etc/nginx/vhost.d  
      - html:/usr/share/nginx/html 
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - nginx-certificates:/etc/nginx/certs:rw
    environment:
      - NGINX_PROXY_CONTAINER=\${COMPOSE_PROJECT_NAME}-nginx
      - DEFAULT_EMAIL=\${ADMIN_EMAIL}

volumes:
  nginx-certificates:
  vhost:
  html:
  dhparam:

networks:
  proxy_network:
    external: false
    name: nginx_network
EOF
    elif [ "$proxy_type" = "traefik" ]; then
        cat >> "$compose_file" << EOF

  traefik:
    image: traefik:v3.5.2
    restart: unless-stopped
    ports:
      - 80:80
      - 443:443
      - 8080:8080
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt_data:/letsencrypt
    networks:
      - proxy_network

volumes:
  letsencrypt_data:

networks:
  proxy_network:
    external: false
    name: traefik_network
EOF
    fi
    
    # Create deployment info file
    local info_file="$deployment_dir/deployment-info.txt"
    cat > "$info_file" << EOF
Deployment Information
=====================
Name: $deployment_name
Type: $proxy_type
Domain: $domain
Admin Email: $admin_email
Docker Host: ${docker_host:-"local"}
Created: $(date)
Proxy Network: $proxy_network

Files:
- docker-compose.yml: Docker Compose configuration
- .env: Environment variables
- deployment-info.txt: This file

To deploy this configuration:
  npm run docker:deploy:up $deployment_name

To view logs:
  docker compose -f $deployment_dir/docker-compose.yml --env-file $deployment_dir/.env logs -f

To stop deployment:
  docker compose -f $deployment_dir/docker-compose.yml --env-file $deployment_dir/.env down
EOF
    
    print_success "Deployment '$deployment_name' created successfully!"
    print_success "Location: $deployment_dir"
    print_success "Domain: $domain"
    print_success "Admin Email: $admin_email"
    if [ -n "$docker_host" ]; then
        print_success "Docker Host: $docker_host"
    fi
    
    echo ""
    print_status "To deploy this configuration, run:"
    echo "  npm run docker:deploy:up $deployment_name"
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
    
    print_status "Creating new deployment configuration..."
    echo ""
    
    # Prompt for deployment name
    local deployment_name
    while true; do
        deployment_name=$(prompt_for_input "Enter deployment name (alphanumeric, hyphens, underscores only)" "")
        if validate_deployment_name "$deployment_name"; then
            # Check if deployment already exists
            if [ -d "deployments/$deployment_name" ]; then
                print_error "Deployment '$deployment_name' already exists!"
                continue
            fi
            break
        else
            print_error "Invalid deployment name. Use only alphanumeric characters, hyphens, and underscores."
        fi
    done
    
    # Prompt for proxy type
    local proxy_type
    while true; do
        echo "Choose proxy type:"
        echo "  1. nginx (with Let's Encrypt)"
        echo "  2. traefik (with Let's Encrypt)"
        echo "  3. custom (external proxy network)"
        echo ""
        
        local choice
        choice=$(prompt_for_input "Enter choice (1, 2, or 3)" "1")
        
        case "$choice" in
            1)
                proxy_type="nginx"
                break
                ;;
            2)
                proxy_type="traefik"
                break
                ;;
            3)
                proxy_type="custom"
                # Prompt for custom network name
                local custom_network
                while true; do
                    custom_network=$(prompt_for_input "Enter custom proxy network name" "")
                    if [ -n "$custom_network" ]; then
                        break
                    else
                        print_error "Proxy network name cannot be empty"
                    fi
                done
                PROXY_NETWORK_CUSTOM="$custom_network"
                break
                ;;
            *)
                print_error "Invalid choice. Please enter 1, 2, or 3."
                ;;
        esac
    done
    
    # Prompt for optional Docker Host
    local docker_host
    docker_host=$(prompt_for_input "Enter Docker Host (optional, leave empty for local)" "")
    
    echo ""
    print_status "Creating deployment with the following configuration:"
    echo "  Name: $deployment_name"
    echo "  Type: $proxy_type"
    if [ "$proxy_type" = "custom" ]; then
        echo "  Network: $PROXY_NETWORK_CUSTOM"
    fi
    if [ -n "$docker_host" ]; then
        echo "  Docker Host: $docker_host"
    fi
    echo ""
    
    # Confirm creation
    local confirm
    confirm=$(prompt_for_input "Create this deployment? (y/N)" "N")
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        create_deployment "$deployment_name" "$proxy_type" "$docker_host"
    else
        print_status "Deployment creation cancelled."
        exit 0
    fi
}

# Run main function with all arguments
main "$@"
