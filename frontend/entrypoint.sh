#!/bin/sh

envsubst '$HOSTNAME' < /etc/nginx/templates/nginx-template.conf > /etc/nginx/nginx.conf
exec "$@"
