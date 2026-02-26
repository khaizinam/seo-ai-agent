module.exports = {
  apps: [
    {
      name: "seo-admin-panel",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "1", // Use "max" if you want to use cluster mode and utilize all CPU cores
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
