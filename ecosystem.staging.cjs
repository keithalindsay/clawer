module.exports = {
  apps: [{
    name: 'clawer-staging',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/opt/clawer-staging',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
    },
    max_memory_restart: '512M',
    error_file: '/root/.pm2/logs/clawer-staging-error.log',
    out_file: '/root/.pm2/logs/clawer-staging-out.log',
  }]
};
