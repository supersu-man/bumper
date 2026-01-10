import url from 'url';
import path from 'path';

const DEV_SERVER_PORT = 4200;

const isDevelopment = process.argv.includes('--dev');

export function getAppUrl(route: string = ''): string {
  const routePath = route ? `#/${route}` : '';

  if (isDevelopment) {
    return `http://localhost:${DEV_SERVER_PORT}/${routePath}`;
  }

  return (
    url.format({
      pathname: path.join(__dirname, 'browser/index.html'),
      protocol: 'file',
      slashes: true,
    }) + routePath
  );
}

export function getAssetUrl(asset: string): string {
  if (!asset) {
    throw new Error('Asset filename is required');
  }

  const assetDir = isDevelopment ? '../src/assets' : 'browser/assets';
  return path.resolve(__dirname, assetDir, asset);
}

export function resolveElectronPath(file: string): string {
  if (!file) {
    throw new Error('File path is required');
  }

  return path.resolve(__dirname, file);
}