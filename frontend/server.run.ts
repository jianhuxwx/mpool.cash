import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

const { readFileSync, existsSync } = fs;

import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Return the list of supported and actually active locales
 */
interface ActiveLocale {
  code: string;
  baseHref: string;
}

function normalizeBaseHref(baseHref: string): string {
  if (!baseHref) {
    return '/';
  }

  if (!baseHref.startsWith('/')) {
    baseHref = '/' + baseHref;
  }

  return baseHref.length > 1 && baseHref.endsWith('/') ? baseHref.slice(0, -1) : baseHref;
}

function getActiveLocales(): ActiveLocale[] {
  const angularConfig = JSON.parse(readFileSync('angular.json', 'utf8'));
  const i18nConfig = angularConfig.projects?.mempool?.i18n ?? {};

  const sourceLocaleConfig = i18nConfig.sourceLocale;
  const sourceLocaleCode = typeof sourceLocaleConfig === 'string' ? sourceLocaleConfig : sourceLocaleConfig?.code;
  const sourceLocaleBaseHref = typeof sourceLocaleConfig === 'object' ? sourceLocaleConfig?.baseHref : '/';

  const localesConfig = i18nConfig.locales || {};

  const candidates: ActiveLocale[] = [];

  if (sourceLocaleCode) {
    candidates.push({
      code: sourceLocaleCode,
      baseHref: normalizeBaseHref(sourceLocaleBaseHref || '/')
    });
  }

  Object.entries(localesConfig).forEach(([code, config]) => {
    if (code === sourceLocaleCode) {
      return;
    }

    const baseHref = typeof config === 'object' && config !== null && 'baseHref' in config
      ? (config as { baseHref?: string }).baseHref
      : undefined;

    candidates.push({
      code,
      baseHref: normalizeBaseHref(baseHref || `/${code}`)
    });
  });

  return candidates.filter(({ code }) => existsSync(`./dist/mempool/browser/${code}`));
}

function loadFrontendConfig(): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync('mempool-frontend-config.json', 'utf8'));
  } catch (error) {
    console.warn('Could not load mempool-frontend-config.json, falling back to defaults', error);
    return {};
  }
}

function registerStaticLocale(server: express.Express, locale: ActiveLocale) {
  const browserFolder = path.join(process.cwd(), `dist/mempool/browser/${locale.code}`);

  if (!existsSync(browserFolder)) {
    console.warn(`Skipping locale ${locale.code}: missing ${browserFolder}`);
    return;
  }

  const mountPath = locale.baseHref === '/' ? '/' : locale.baseHref;
  const router = express.Router();

  router.use(express.static(browserFolder, { index: false, maxAge: '1y' }));
  router.get('*', (_req, res) => {
    res.sendFile(path.join(browserFolder, 'index.html'));
  });

  server.use(mountPath, router);
}

function app() {
  const server = express();

  const frontendConfig = loadFrontendConfig();
  const nginxProtocol = frontendConfig.NGINX_PROTOCOL || 'https';
  const nginxHost = frontendConfig.NGINX_HOSTNAME || 'api.mpool.cash';
  const nginxPort = frontendConfig.NGINX_PORT || '443';
  const apiTarget = `${nginxProtocol}://${nginxHost}:${nginxPort}`;
  const wsProtocol = nginxProtocol === 'https' ? 'wss' : 'ws';
  const wsTarget = `${wsProtocol}://${nginxHost}:${nginxPort}/api/v1/ws`;

  server.use('/api/v1/ws', createProxyMiddleware({
    target: wsTarget,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
  }));

  server.use('/api', createProxyMiddleware({
    target: apiTarget,
    changeOrigin: true,
  }));

  const resourcesDir = path.join(process.cwd(), 'dist/mempool/browser/resources');
  if (existsSync(resourcesDir)) {
    server.use('/resources', express.static(resourcesDir, { maxAge: '1y', index: false }));
  }

  const faviconPath = path.join(resourcesDir, 'favicons', 'favicon.ico');
  if (existsSync(faviconPath)) {
    server.get('/favicon.ico', (_req, res) => res.sendFile(faviconPath));
  }

  const manifestPath = path.join(resourcesDir, 'favicons', 'site.webmanifest');
  if (existsSync(manifestPath)) {
    server.get('/site.webmanifest', (_req, res) => res.sendFile(manifestPath));
  }

  const locales = getActiveLocales();
  const defaultLocale = 'en-US';
  const defaultLocaleConfig = locales.find(({ code }) => code === defaultLocale);

  if (!defaultLocaleConfig) {
    throw new Error(`Default locale ${defaultLocale} not found in build output.`);
  }

  const otherLocales = locales.filter(({ code }) => code !== defaultLocale);

  otherLocales.forEach(({ code, baseHref }) => {
    registerStaticLocale(server, { code, baseHref });
  });

  console.log(`serving default locale: ${defaultLocale}`);
  registerStaticLocale(server, defaultLocaleConfig);
  registerStaticLocale(server, { code: defaultLocaleConfig.code, baseHref: '/en' });

  return server;
}

function run() {
  const port = process.env.PORT || 4000;

  app().listen(port, () => {
    console.log(`Node Express server listening on port ${port}`);
  });
}

run();