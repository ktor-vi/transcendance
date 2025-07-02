#!/bin/sh

# Substitue les variables d'environnement dans le template
envsubst '$HOSTNAME' < /etc/nginx/templates/nginx-template.conf > /etc/nginx/nginx.conf

# Exécute le CMD original du conteneur nginx
exec "$@"