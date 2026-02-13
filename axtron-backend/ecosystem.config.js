module.exports = {
  apps: [
    {
      name: 'desejoshot-seo-engine',
      script: './src/seo-engine.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        SEO_ENGINE_PORT: 4100
      },
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    }
  ]
};
