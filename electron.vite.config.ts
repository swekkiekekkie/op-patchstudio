import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const root = import.meta.dirname;
const mtpScriptSrc = resolve(root, 'electron/main/mtp.ps1');
const mtpScriptDest = resolve(root, 'out/main/mtp.ps1');

function copyMtpScript(): Plugin {
  const copy = () => {
    mkdirSync(resolve(root, 'out/main'), { recursive: true });
    copyFileSync(mtpScriptSrc, mtpScriptDest);
  };
  return {
    name: 'copy-mtp-script',
    buildStart: copy,
    writeBundle: copy,
  };
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMtpScript()],
    build: {
      lib: {
        entry: resolve(root, 'electron/main/index.ts'),
        formats: ['cjs'],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(root, 'electron/preload/index.ts'),
        formats: ['cjs'],
      },
    },
  },
  renderer: {
    root: '.',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve(root, 'index.html'),
      },
    },
  },
});
