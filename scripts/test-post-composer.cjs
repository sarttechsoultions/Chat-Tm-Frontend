// Run against a local dev server. All API responses are isolated browser fixtures.
// Set PLAYWRIGHT_MODULE to an installed Playwright module if it is not local.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.COMPOSER_TEST_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Use a localhost server only.');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let activeUser = { id: 'composer-test-a', username: 'composer_test', firstName: 'Asha', lastName: 'Test', role: 'USER', avatar: '', isVerified: false, referralCode: 'fixture' };
  let failPublish = true;
  let publishCount = 0;
  let publishedMedia = false;
  const originalPost = { id: 'editable-post', body: 'Original text', heading: '', privacy: 'PUBLIC', location: '', feeling: '', author: activeUser, mentions: [], media: [], likesCount: 0, commentsCount: 0, sharesCount: 0, liked: false, likedBy: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.addCookies([{ name: 'chattm_session', value: 'fixture.test.token', url: base }, { name: 'chattm_role', value: 'USER', url: base }]);
  await context.addInitScript(user => {
    if (!localStorage.getItem('chattm_user')) localStorage.setItem('chattm_user', JSON.stringify(user));
    localStorage.setItem('chattm_session', 'fixture.test.token');
  }, activeUser);
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.startsWith('/socket.io')) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let data = { items: [], hasMore: false, nextCursor: null, count: 0, unreadCount: 0 };
    if (url.pathname.endsWith('/auth/me')) data = { user: activeUser };
    if (url.pathname.endsWith('/posts/editable-post')) data = originalPost;
    if (url.pathname.endsWith('/posts') && request.method() === 'POST') {
      publishCount++;
      publishedMedia = request.postDataBuffer()?.includes(Buffer.from('filename="tiny.png"')) || false;
      if (failPublish) return route.fulfill({ status: 503, headers, json: { message: 'Temporary upload issue' } });
      // Keep the request pending briefly so double-click protection is exercised.
      await new Promise(resolve => setTimeout(resolve, 200));
      data = { ...originalPost, id: 'new-post', body: 'Draft survives refresh', author: activeUser };
    }
    await route.fulfill({ headers, json: { success: true, data } });
  });
  const draftRecord = () => page.evaluate(async () => {
    const userId = JSON.parse(localStorage.getItem('chattm_user')).id;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('chattm-post-drafts', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('drafts', 'readonly');
        const get = tx.objectStore('drafts').get(userId);
        get.onsuccess = () => resolve(get.result ? { caption: get.result.caption, files: get.result.files.map(file => ({ name: file.name, size: file.size, type: file.type })) } : null);
        tx.oncomplete = () => db.close();
      };
    });
  });
  const waitFor = async predicate => {
    const end = Date.now() + 12000;
    while (Date.now() < end) {
      if (await predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Timed out waiting for composer state');
  };
  const visibleFooter = async label => {
    const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
    const nav = await page.getByRole('dialog').isVisible() ? null : await page.getByRole('navigation', { name: 'Mobile navigation' }).boundingBox();
    assert.ok(box && box.y >= 0 && box.y + box.height <= (nav?.y || page.viewportSize().height), `Action obscured: ${JSON.stringify({box, nav})}`);
    assert.equal(await page.getByRole('button', { name: label, exact: true }).evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
    }), true, 'Action can receive clicks without overlapping content');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
  };
  try {
    await page.goto(base + '/create-post');
    const text = page.getByRole('textbox', { name: 'Post text', exact: true });
    await text.waitFor();
    await waitFor(() => text.isEnabled());
    await text.fill('Draft survives refresh');
    // A small real PNG exercises preparation, IndexedDB File storage and restore.
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
    await page.locator('input[type=file]').setInputFiles({ name: 'tiny.png', mimeType: 'image/png', buffer: png });
    await page.getByRole('button', { name: '+ Add a heading', exact: true }).click();
    await page.getByRole('textbox', { name: 'Post heading (optional)' }).fill('Weekend update');
    await page.getByRole('button', { name: 'Post audience: Public' }).click();
    await page.getByRole('button', { name: /^Friends Your friends only$/ }).click();
    await waitFor(async () => (await draftRecord())?.files.length === 1);
    await visibleFooter('Post');
    await page.reload();
    await waitFor(() => text.isEnabled());
    assert.equal(await text.inputValue(), 'Draft survives refresh');
    assert.equal(await page.getByRole('textbox', { name: 'Post heading (optional)' }).inputValue(), 'Weekend update');
    await page.getByRole('button', { name: 'Post audience: Friends' }).waitFor();
    assert.equal(await page.getByRole('img', { name: 'Attached photo preview' }).count(), 1);
    assert.equal((await draftRecord()).files[0].name, 'tiny.png');
    console.log('PASS: text and media survive refresh');

    await text.fill('Account switch preserves pending text');
    activeUser = { ...activeUser, id: 'composer-test-b', username: 'composer_b', firstName: 'Ravi' };
    await page.evaluate(user => { localStorage.setItem('chattm_user', JSON.stringify(user)); window.dispatchEvent(new Event('chattm:user-updated')); }, activeUser);
    await waitFor(async () => await text.isEnabled() && await text.inputValue() === '');
    assert.equal(await draftRecord(), null);
    await text.fill('Separate account draft');
    await waitFor(async () => (await draftRecord())?.caption === 'Separate account draft');
    activeUser = { ...activeUser, id: 'composer-test-a', username: 'composer_test', firstName: 'Asha' };
    await page.evaluate(user => { localStorage.setItem('chattm_user', JSON.stringify(user)); window.dispatchEvent(new Event('chattm:user-updated')); }, activeUser);
    await waitFor(async () => await text.isEnabled() && await text.inputValue() === 'Account switch preserves pending text');
    assert.equal((await draftRecord()).files.length, 1);
    await text.fill('Draft survives refresh');
    await waitFor(async () => (await draftRecord())?.caption === 'Draft survives refresh');
    console.log('PASS: account switching keeps drafts and media separate');

    await page.getByRole('button', { name: 'Post', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Temporary upload issue' }).waitFor();
    assert.equal(await text.inputValue(), 'Draft survives refresh');
    assert.equal((await draftRecord()).files.length, 1);
    assert.equal(publishCount, 1);
    await visibleFooter('Try again');
    console.log('PASS: failed publishing retains content and supports retry');

    const output = path.resolve(process.env.COMPOSER_TEST_OUTPUT || path.join(os.tmpdir(), 'chattm-post-composer'));
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'mobile-composer.png'), animations: 'disabled' });
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 430 });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    let keyboardAction = await page.getByRole('button', { name: 'Try again', exact: true }).boundingBox();
    assert.ok(keyboardAction.y + keyboardAction.height <= 430, 'Page action remains above a simulated mobile keyboard');
    await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
    await page.setViewportSize({ width: 390, height: 500 });
    await visibleFooter('Try again');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: path.join(output, 'desktop-composer.png'), animations: 'disabled' });
    console.log('PASS: actions visible at mobile, short viewport and desktop sizes');

    failPublish = false;
    await page.getByRole('button', { name: 'Try again', exact: true }).dblclick();
    await page.waitForURL(base + '/');
    await page.getByRole('status').filter({ hasText: 'Post published successfully.' }).waitFor();
    assert.equal(publishCount, 2, 'One failure plus exactly one successful retry');
    assert.equal(publishedMedia, true, 'Restored File is submitted in multipart payload');
    assert.equal(await draftRecord(), null, 'Successful publication clears only this account draft');
    console.log('PASS: retry publishes once, includes restored media, clears draft and shows success');

    await page.getByRole('button', { name: /Create something amazing/ }).click();
    await page.getByRole('dialog').waitFor();
    await waitFor(() => text.isEnabled());
    await text.fill('Close immediately and restore');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: /Create something amazing/ }).click();
    await waitFor(async () => await text.isEnabled() && await text.inputValue() === 'Close immediately and restore');
    await page.setViewportSize({ width: 390, height: 500 });
    await visibleFooter('Post');
    await page.screenshot({ path: path.join(output, 'mobile-modal.png'), animations: 'disabled' });
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 300 });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    keyboardAction = await page.getByRole('button', { name: 'Post', exact: true }).boundingBox();
    assert.ok(keyboardAction.y + keyboardAction.height <= 300, 'Modal action remains above a simulated mobile keyboard');
    await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
    await page.getByRole('button', { name: 'Close', exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.getByRole('button', { name: 'Post', exact: true }).evaluate(element => element === document.activeElement), true, 'Modal traps keyboard focus');
    await page.evaluate(() => {
      window.__originalDraftPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function () { throw new DOMException('Test storage quota', 'QuotaExceededError'); };
    });
    await text.fill('Storage retry keeps this text');
    await page.getByRole('alert').filter({ hasText: "Couldn't save your draft" }).waitFor();
    assert.equal(await text.inputValue(), 'Storage retry keeps this text');
    await page.evaluate(() => { IDBObjectStore.prototype.put = window.__originalDraftPut; });
    await page.getByRole('button', { name: 'Retry draft save', exact: true }).click();
    await waitFor(async () => (await draftRecord())?.caption === 'Storage retry keeps this text');
    console.log('PASS: storage failure retains content and manual retry recovers');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    console.log('PASS: modal close flushes pending auto-save and restores draft');

    await page.goto(base + '/create-post?edit=editable-post');
    await waitFor(() => text.isEnabled());
    assert.equal(await text.inputValue(), 'Original text');
    await text.fill('Unsaved edit');
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: 'Go back' }).click();
    assert.equal(await text.inputValue(), 'Unsaved edit');
    assert.equal((await draftRecord()).caption, 'Storage retry keeps this text', 'Editing never overwrites the new-post draft');
    console.log('PASS: edit cancellation protects changes and preserves the new-post draft');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log('PASS: no browser runtime errors');
    console.log('Screenshots: ' + output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
