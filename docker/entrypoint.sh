#!/bin/bash
set -e

# Cache config, routes, views for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations automatically on startup
php artisan migrate --force

# Start all services via supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
