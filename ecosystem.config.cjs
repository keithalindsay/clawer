module.exports = {
  apps: [{
    name: 'clawer',
    script: 'npm',
    args: 'start',
    cwd: '/opt/clawer',
    env_file: '/opt/clawer/.env',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
