const fs = require('fs');
const { URL } = require('url');

const FRONTEND_CONFIG_FILE_NAME = 'mempool-frontend-config.json';

let configContent;

// Read frontend config 
try {
    const rawConfig = fs.readFileSync(FRONTEND_CONFIG_FILE_NAME);
    configContent = JSON.parse(rawConfig);
    console.log(`${FRONTEND_CONFIG_FILE_NAME} file found, using provided config`);
} catch (e) {
    console.log(e);
    if (e.code !== 'ENOENT') {
      throw new Error(e);
  } else {
      console.log(`${FRONTEND_CONFIG_FILE_NAME} file not found, using default config`);
  }
}

const DEFAULT_API_TARGET = 'http://127.0.0.1:8999';
const DEFAULT_SERVICES_TARGET = 'http://127.0.0.1:8999';

const resolveTarget = (fallback, value) => {
  if (!value) {
    return fallback;
  }
  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch (err) {
    console.warn(`Invalid proxy target "${value}". Falling back to ${fallback}.`);
    return fallback;
  }
};

const apiTarget = resolveTarget(DEFAULT_API_TARGET, configContent?.API_BASE_URL);
const servicesTarget = resolveTarget(DEFAULT_SERVICES_TARGET, configContent?.SERVICES_API);

let PROXY_CONFIG = [];

if (configContent && configContent.BASE_MODULE === 'liquid') {
  PROXY_CONFIG.push(...[
    {
      context: ['/liquid/api/v1/**'],
      target: apiTarget,
      secure: false,
      ws: true,
      changeOrigin: true,
      proxyTimeout: 30000,
      pathRewrite: {
          "^/liquid": ""
      },
    },
    {
      context: ['/liquid/api/**'],
      target: apiTarget,
      secure: false,
      changeOrigin: true,
      proxyTimeout: 30000,
      pathRewrite: {
          "^/liquid/api/": "/api/v1/"
      },
    },
    {
      context: ['/liquidtestnet/api/v1/**'],
      target: apiTarget,
      secure: false,
      ws: true,
      changeOrigin: true,
      proxyTimeout: 30000,
      pathRewrite: {
          "^/liquidtestnet": ""
      },
    },
    {
      context: ['/liquidtestnet/api/**'],
      target: apiTarget,
      secure: false,
      changeOrigin: true,
      proxyTimeout: 30000,
      pathRewrite: {
          "^/liquidtestnet/api/": "/api/v1/"
      },
    },
  ]);
}

PROXY_CONFIG.push(...[
  {
    context: ['/testnet/api/v1/lightning/**'],
    target: apiTarget,
    secure: false,
    changeOrigin: true,
    proxyTimeout: 30000,
    pathRewrite: {
        "^/testnet": ""
    },
  },
  {
    context: ['/api/v1/services/**'],
    target: servicesTarget,
    secure: false,
    ws: true,
    changeOrigin: true,
    proxyTimeout: 30000,
  },
  {
    context: ['/api/v1/**'],
    target: apiTarget,
    secure: false,
    ws: true,
    changeOrigin: true,
    proxyTimeout: 30000,
  },
  {
    context: ['/api/**'],
    target: apiTarget,
    secure: false,
    changeOrigin: true,
    proxyTimeout: 30000,
    pathRewrite: {
        "^/api/": "/api/v1/"
    },
  }
]);

console.log(PROXY_CONFIG);

module.exports = PROXY_CONFIG;