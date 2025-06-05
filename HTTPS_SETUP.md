# HTTPS Setup Guide

This guide explains how to configure OAuth to work with HTTPS in your application.

## Quick Start

### For Development (Self-Signed Certificates)

1. **Enable HTTPS mode:**
   ```bash
   ./toggle-https.sh enable
   ```

2. **Start the application:**
   ```bash
   docker-compose up frontend-prod backend-prod
   ```

3. **Access your app:**
   - Frontend: https://localhost
   - Backend API: https://localhost/api

### For Production

1. **Update Google OAuth Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add callback URL: `https://yourdomain.com/api/login/google/callback`
   - Add authorized origin: `https://yourdomain.com`

2. **Configure production environment:**
   ```bash
   cp .env.production .env
   # Edit .env and replace 'yourdomain.com' with your actual domain
   ```

3. **Install proper SSL certificates:**
   - Replace `ssl/nginx-selfsigned.crt` with your SSL certificate
   - Replace `ssl/nginx-selfsigned.key` with your private key

4. **Deploy:**
   ```bash
   docker-compose up frontend-prod backend-prod
   ```

## Configuration Files

### Environment Variables

The application uses these environment variables for HTTPS:

- `BASE_URL`: Backend URL for OAuth callbacks
- `FRONTEND_URL`: Frontend URL for redirects after login
- `NODE_ENV`: Set to 'production' for secure cookies

### SSL Certificates

SSL certificates are stored in the `ssl/` directory:
- `ssl/nginx-selfsigned.crt`: SSL certificate
- `ssl/nginx-selfsigned.key`: Private key

## Scripts

### `generate-ssl.sh`
Generates self-signed SSL certificates for development.

### `toggle-https.sh`
Switches between HTTP and HTTPS configurations:
- `./toggle-https.sh enable` - Enable HTTPS
- `./toggle-https.sh disable` - Disable HTTPS (back to HTTP)

## Docker Configuration

### Development with HTTPS
```bash
docker-compose up frontend-prod backend-prod
```

### Development with HTTP
```bash
docker-compose up frontend-dev backend-dev
```

## Security Features

1. **SSL/TLS Configuration:**
   - TLS 1.2 and 1.3 support
   - Strong cipher suites
   - Session caching

2. **Secure Cookies:**
   - HttpOnly cookies
   - Secure flag in production
   - SameSite protection

3. **CORS Configuration:**
   - Supports both HTTP and HTTPS origins
   - Credentials enabled for OAuth

## Troubleshooting

### Browser Certificate Warnings
For development with self-signed certificates:
1. Browser will show security warning
2. Click "Advanced" → "Proceed to localhost (unsafe)"
3. This is normal for self-signed certificates

### OAuth Callback Errors
If OAuth fails:
1. Check Google OAuth Console configuration
2. Verify callback URLs match exactly
3. Ensure HTTPS is properly configured

### Port Conflicts
If ports are in use:
- HTTPS uses port 443
- HTTP fallback uses port 80
- Backend uses port 3000

### Environment Issues
Check your `.env` file:
```bash
# For HTTPS
BASE_URL=https://localhost:3000
FRONTEND_URL=https://localhost:443

# For HTTP
BASE_URL=http://localhost:3000  
FRONTEND_URL=http://localhost:5173
```

## Production Checklist

- [ ] Update Google OAuth Console with production URLs
- [ ] Install proper SSL certificates (not self-signed)
- [ ] Configure DNS to point to your server
- [ ] Update `.env` with production domain
- [ ] Set `NODE_ENV=production`
- [ ] Test OAuth flow end-to-end
- [ ] Monitor SSL certificate expiration

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Let's Encrypt SSL Certificates](https://letsencrypt.org/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)