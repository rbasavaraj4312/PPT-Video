import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from '../tailwind.config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const request = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slide-media-'));
try {
  const presentation = structuredClone(request.presentation);
  for (const [index, slide] of presentation.slides.entries()) {
    if (slide.media?.kind !== 'video') continue;
    const match = /^data:video\/(mp4|webm);base64,([A-Za-z0-9+/=]+)$/.exec(slide.media.src);
    if (!match) throw new Error('Invalid embedded video');
    const name = `clip-${index}.${match[1]}`;
    fs.writeFileSync(path.join(publicDir, name), Buffer.from(match[2], 'base64'));
    slide.media.src = name;
  }
  const inputProps = { presentation, assetBase: request.assetBase };
  const cssPath = path.join(path.dirname(request.output), 'render-styles.css');
  const css = await postcss([tailwindcss({ ...tailwindConfig,
    content: [path.join(root, 'src/**/*.{js,jsx,ts,tsx}')] }), autoprefixer()])
    .process(fs.readFileSync(path.join(root, 'src/index.css'), 'utf8'), { from: path.join(root, 'src/index.css') });
  fs.writeFileSync(cssPath, css.css);
  const serveUrl = await bundle({ publicDir, entryPoint: path.join(root, 'src/narration/render-entry.jsx'),
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

} finally { fs.rmSync(publicDir, { recursive: true, force: true }); }
