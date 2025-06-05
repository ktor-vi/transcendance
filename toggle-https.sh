#!/bin/bash

# Script to toggle between HTTP and HTTPS configurations

if [ "$1" = "enable" ]; then
    echo "Enabling HTTPS configuration..."
    
    # Update .env file for HTTPS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|BASE_URL=http://localhost:3000|BASE_URL=https://localhost:3000|g' .env
        sed -i '' 's|FRONTEND_URL=http://localhost:5173|FRONTEND_URL=https://localhost:443|g' .env
    else
        sed -i 's|BASE_URL=http://localhost:3000|BASE_URL=https://localhost:3000|g' .env
        sed -i 's|FRONTEND_URL=http://localhost:5173|FRONTEND_URL=https://localhost:443|g' .env
    fi
    
    # Generate SSL certificates if they don't exist
    if [ ! -f "ssl/nginx-selfsigned.crt" ]; then
        echo "Generating SSL certificates..."
        ./generate-ssl.sh
    fi
    
    echo "HTTPS enabled. Use 'docker-compose up frontend-prod backend-prod' to run with HTTPS"
    echo "Access your app at: https://localhost"
    
elif [ "$1" = "disable" ]; then
    echo "Disabling HTTPS configuration..."
    
    # Update .env file for HTTP
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|BASE_URL=https://localhost:3000|BASE_URL=http://localhost:3000|g' .env
        sed -i '' 's|FRONTEND_URL=https://localhost:443|FRONTEND_URL=http://localhost:5173|g' .env
    else
        sed -i 's|BASE_URL=https://localhost:3000|BASE_URL=http://localhost:3000|g' .env
        sed -i 's|FRONTEND_URL=https://localhost:443|FRONTEND_URL=http://localhost:5173|g' .env
    fi
    
    echo "HTTPS disabled. Use 'docker-compose up frontend-dev backend-dev' to run with HTTP"
    echo "Access your app at: http://localhost:5173"
    
else
    echo "Usage: $0 [enable|disable]"
    echo "  enable  - Configure for HTTPS (production mode)"
    echo "  disable - Configure for HTTP (development mode)"
    exit 1
fi