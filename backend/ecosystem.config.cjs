module.exports = {
  apps: [
    {
      name: "lyrics-embedder-backend",
      script: "./server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3099,
      }
    },
    {
      name: "cloudflare-tunnel",
      script: "cloudflared",
      args: "tunnel run vant"
    }
  ]
};
