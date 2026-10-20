// Isolated browser check; save requests stay inside this fixture.
import { openBrowser } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '../..'), output = path.join(root, 'output/image-edit-check');
const source = fs.readFileSync(path.join(output, 'source.png')).toString('base64');
let deck = { id: 'image-edit-check', title: 'Image edit check', aspect_ratio: '16:9', slides: [
  { id: 'one', title: 'Images', background: '#081321', slide_duration: 2, transition_type: 'none', elements: [] },
] };
const browser = await openBrowser('chrome', { browserExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', logLevel: 'error' });
try {
  const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
  const client = page._client(), errors = [];
  client.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/presentations/image-edit-check' }, { urlPattern: '*/api/presentations' }] });
  client.on('Fetch.requestPaused', async event => {
    if (event.request.method === 'POST') deck = JSON.parse(event.request.postData);
    const body = event.request.url.endsWith('/presentations') && event.request.method === 'GET' ? [] : deck;
    await client.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: event.request.method === 'OPTIONS' ? 204 : 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }],
      ...(event.request.method !== 'OPTIONS' ? { body: Buffer.from(JSON.stringify(body)).toString('base64') } : {}) });
  });
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  await page.goto({ url: 'http://localhost:3000/editor/image-edit-check', timeout: 30000 });
  async function waitFor(predicate, label) {
    const deadline = Date.now() + 12000;
    while (!await page.evaluate(predicate)) {
      if (Date.now() > deadline) throw new Error(`${label}: ${errors.join('\n')}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  async function button(text) { await page.evaluate(value => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === value)?.click(), text); }
  async function input(label, value) {
    await page.evaluate(({ label, value }) => {
      const el = document.querySelector(`input[aria-label="${label}"]`);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(value));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, { label, value });
  }
  await waitFor(() => Boolean(document.querySelector('.workspace-stage')), 'Workspace');
  await new Promise(resolve => setTimeout(resolve, 300));
  await page.evaluate(async base64 => {
    const blob = await fetch('data:image/png;base64,' + base64).then(response => response.blob());
    const data = new DataTransfer(); data.items.add(new File([blob], 'Clipboard image.png', { type: 'image/png' }));
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  }, source);
  await waitFor(() => Boolean(document.querySelector('.image-properties')), 'Pasted image selected');
  const dimensions = await page.evaluate(() => [Number(document.querySelector('input[aria-label="Image width"]').value), Number(document.querySelector('input[aria-label="Image height"]').value)]);
  assert.deepEqual(dimensions, [320, 160]);
  await input('Image width', 400);
  await waitFor(() => document.querySelector('input[aria-label="Image height"]').value === '200', 'Aspect ratio resize');
  await button('Crop image');
  await waitFor(() => Boolean(document.querySelector('[role="dialog"][aria-label="Crop image"]')), 'Crop dialog');
  await button('Square');
  const selection = await page.evaluate(() => {
    const rect = document.querySelector('.image-crop-selection').getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...selection, button: 'left', clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: selection.x + 30, y: selection.y, button: 'left', buttons: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: selection.x + 30, y: selection.y, button: 'left', clickCount: 1 });
  await waitFor(() => Number(document.querySelector('input[aria-label="Crop left"]').value) > 25, 'Crop selection moves');
  await button('Apply crop');
  await waitFor(() => document.querySelector('input[aria-label="Image height"]').value === '400', 'Crop applied');
  await page.evaluate(() => document.querySelector('button[aria-label="Undo"]').click());
  await waitFor(() => document.querySelector('.workspace-stage image')?.closest('svg').getAttribute('viewBox') === '0 0 320 160', 'Crop undo');
  await page.evaluate(() => document.querySelector('button[aria-label="Redo"]').click());
  await waitFor(() => document.querySelector('.workspace-stage image')?.closest('svg').getAttribute('viewBox').split(' ')[2] === '160', 'Crop redo');
  const imagePoint = await page.evaluate(() => {
    const rect = document.querySelector('.workspace-stage svg').getBoundingClientRect();
    return { x: rect.left + rect.width * .5, y: rect.top + rect.height * .5 };
  });
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...imagePoint, button: 'left', clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...imagePoint, button: 'left', clickCount: 1 });
  await waitFor(() => Boolean(document.querySelector('.image-properties')), 'Image selected after redo');
  await button('Flip horizontal'); await button('Rotate 90°'); await input('Image opacity', 70); await input('Image brightness', 120);
  await button('Save');
  await waitFor(() => document.querySelector('button[title="Save to JSON (Ctrl+S)"]')?.textContent?.includes('Saved'), 'Save completes');
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(deck.slides[0].elements[0].type, 'image');
  assert.equal(deck.slides[0].elements[0].rotation, 90);
  assert.equal(deck.slides[0].elements[0].opacity, .7);
  assert.equal(deck.slides[0].elements[0].flip_x, true);
  assert.ok(deck.slides[0].elements[0].image_crop.x > .25);
  fs.writeFileSync(path.join(output, 'presentation.json'), JSON.stringify(deck, null, 2));
  await page.goto({ url: 'http://localhost:3000/editor/image-edit-check', timeout: 30000 });
  await waitFor(() => Boolean(document.querySelector('.workspace-stage image')), 'Saved image reloaded');
  await page.evaluate(async base64 => {
    document.querySelector('#slide-script').focus();
    const blob = await fetch('data:image/png;base64,' + base64).then(response => response.blob());
    const data = new DataTransfer(); data.items.add(new File([blob], 'Ignore in text.png', { type: 'image/png' }));
    document.querySelector('#slide-script').dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  }, source);
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(await page.evaluate(() => document.querySelectorAll('.workspace-stage image').length), 1, 'Image paste does not interrupt text fields');
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, 'editor.png'), Buffer.from(screenshot.value.data, 'base64'));
  await page.evaluate(() => document.querySelector('button[aria-label="Play preview"]').click());
  await waitFor(() => Boolean(document.querySelector('.workspace-inline-preview image')), 'Image appears in preview');
  assert.deepEqual(errors, []);
  const report = { clipboard_paste: true, text_field_paste_preserved: true, aspect_ratio_resize: true, draggable_crop: true, crop_undo_redo: true, flip_rotation_adjustments: true, save_reload: true, preview: true, errors };
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close({ silent: true }); }
