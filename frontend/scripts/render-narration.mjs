import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from '../tailwind.config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const request = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const inputProps = { presentation: request.presentation, assetBase: request.assetBase };
const cssPath = path.join(path.dirname(request.output), 'render-styles.css');
const css = await postcss([tailwindcss({ ...tailwindConfig,
  content: [path.join(root, 'src/**/*.{js,jsx,ts,tsx}')] }), autoprefixer()])
  .process(fs.readFileSync(path.join(root, 'src/index.css'), 'utf8'), { from: path.join(root, 'src/index.css') });
fs.writeFileSync(cssPath, css.css);
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/narration/render-entry.jsx'),
  onProgress: progress => console.log(`Bundling ${progress}%`),
  webpackOverride: config => ({ ...config,
    module: { ...config.module, rules: [...(config.module?.rules || []), { test: /\.[cm]?jsx?$/, resolve: { fullySpecified: false } }] },
    resolve: { ...config.resolve,
    alias: { ...config.resolve?.alias, '@': path.join(root, 'src'), 'narration-render-styles': cssPath } } }) });
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const composition = await selectComposition({ serveUrl, id: 'NarratedPresentation', inputProps, browserExecutable });
await renderMedia({ serveUrl, composition, inputProps, outputLocation: request.output,
  codec: 'h264', audioCodec: 'aac', concurrency: 1, browserExecutable,
  onProgress: ({ progress }) => console.log(`Rendering ${Math.round(progress * 100)}%`) });
