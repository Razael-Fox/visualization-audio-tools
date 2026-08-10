#!/bin/bash
set -e

DOMAIN="vant.s.razael-fox.my.id"
TUNNEL_NAME="vant"
PORT="3099"

echo "=== VANT Cloudflare Tunnel Setup ==="

# Check for cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "Error: cloudflared is not installed."
    echo "Install it first: curl -L 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64' -o cloudflared && chmod +x cloudflared && sudo mv cloudflared /usr/local/bin"
    exit 1
fi

echo "[1/4] Checking Cloudflare authentication..."
if [ ! -f ~/.cloudflared/cert.pem ]; then
    echo "Opening browser to authenticate with Cloudflare..."
    cloudflared tunnel login
else
    echo "Already authenticated."
fi

echo "[2/4] Creating tunnel '$TUNNEL_NAME'..."
cloudflared tunnel create "$TUNNEL_NAME" || echo "Tunnel might already exist, continuing..."

echo "[3/4] Routing DNS to $DOMAIN..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN" || echo "DNS might already be routed, continuing..."

echo "[4/4] Generating configuration..."
TUNNEL_UUID=$(cloudflared tunnel list | grep -w "$TUNNEL_NAME" | awk '{print $1}')

if [ -z "$TUNNEL_UUID" ]; then
    echo "Error: Could not find tunnel UUID for $TUNNEL_NAME"
    exit 1
fi

CRED_FILE="$HOME/.cloudflared/${TUNNEL_UUID}.json"

cat << EOF > ~/.cloudflared/config.yml
tunnel: $TUNNEL_UUID
credentials-file: $CRED_FILE

ingress:
  - hostname: $DOMAIN
    service: http://localhost:$PORT
  - service: http_status:404
EOF

echo "Success! config.yml created at ~/.cloudflared/config.yml"
echo "You can now run 'pm2 restart ecosystem.config.cjs' to start the tunnel in the background."
