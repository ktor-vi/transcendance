#!/bin/bash

# Generate SSL certificates for development
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/nginx-selfsigned.key 2048

# Generate certificate signing request
openssl req -new -key ssl/nginx-selfsigned.key -out ssl/nginx-selfsigned.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/nginx-selfsigned.csr -signkey ssl/nginx-selfsigned.key -out ssl/nginx-selfsigned.crt

# Clean up CSR file
rm ssl/nginx-selfsigned.csr

echo "SSL certificates generated in ssl/ directory"
echo "- Private key: ssl/nginx-selfsigned.key"
echo "- Certificate: ssl/nginx-selfsigned.crt"