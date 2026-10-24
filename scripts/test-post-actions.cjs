// Local UI regression tests. API calls use isolated browser fixtures, never live accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.COMPOSER_TEST_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Use localhost only.');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const viewer = { id: 'actions-viewer', username: 'viewer', firstName: 'Asha', lastName: 'Test', role: 'USER', avatar: '', isVerified: false, referralCode: 'fixture' };
  let activeUser = viewer;
  const author = { ...viewer, id: 'actions-author', username: 'author', firstName: 'Ravi' };
  const makePost = (id, who = author) => ({
    id, body: `A moment to remember: ${id}`, heading: 'A day outdoors', privacy: 'PUBLIC', location: '', feeling: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), edited: false, author: who,
    mentions: [], media: [], likedBy: [], likesCount: 0, commentsCount: 0, sharesCount: 0, liked: false,
  });
  const posts = [makePost('post-one'), makePost('post-two'), makePost('own-post', viewer)];
  const preferences = new Map();
  const reports = new Set();
  const preference = (id, userId = activeUser.id) => preferences.get(`${userId}:${id}`) || { saved: false, hidden: false, order: 0 };
  const mapped = (post, userId) => ({ ...post, ...preference(post.id, userId) });
  let failSave = true, failHide = true, failUndo = false, failReport = true, failLibrary = true, failMore = true;
  let saveCalls = 0, reportCalls = 0, order = 0;
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await context.addCookies([{ name: 'chattm_session', value: 'fixture.test.token', url: base }, { name: 'chattm_role', value: 'USER', url: base }]);
  await context.addInitScript(user => {
    if (!localStorage.getItem('chattm_user')) localStorage.setItem('chattm_user', JSON.stringify(user));
    localStorage.setItem('chattm_session', 'fixture.test.token');
  }, viewer);
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.startsWith('/socket.io')) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const userId = activeUser.id;
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    const reply = (status, json) => route.fulfill({ status, headers, json });
    const failure = message => reply(503, { message });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let data = { items: [], hasMore: false, nextCursor: null, count: 0, unreadCount: 0 };
    if (url.pathname.endsWith('/auth/me')) data = { user: activeUser };
    else if (url.pathname.endsWith('/posts/library')) {
      if (failLibrary) return failure('Library temporarily unavailable');
      const view = url.searchParams.get('view') || 'saved';
      const all = posts.filter(post => preference(post.id, userId)[view]).sort((a, b) => preference(b.id, userId).order - preference(a.id, userId).order);
      const next = url.searchParams.get('cursor');
      if (next && failMore) { failMore = false; return failure('More posts temporarily unavailable'); }
      data = next ? { items: all.slice(1).map(post => mapped(post, userId)), nextCursor: null, hasMore: false }
        : { items: all.slice(0, 1).map(post => mapped(post, userId)), nextCursor: all.length > 1 ? 'fixture-next' : null, hasMore: all.length > 1 };
    } else if (url.pathname.endsWith('/posts')) {
      data = { items: posts.filter(post => !preference(post.id, userId).hidden).map(post => mapped(post, userId)), nextCursor: null, hasMore: false };
    } else {
      const match = url.pathname.match(/\/posts\/([^/]+)\/(save|hide|report)$/);
      if (match) {
        const [, id, action] = match;
        const input = request.postDataJSON();
        if (action === 'save') {
          saveCalls++;
          if (failSave) { failSave = false; return failure('Save temporarily unavailable'); }
          await new Promise(resolve => setTimeout(resolve, 150));
          const current = preference(id, userId);
          const next = { ...current, saved: input.saved, order: ++order };
          preferences.set(`${userId}:${id}`, next);
          data = next;
        } else if (action === 'hide') {
          if (input.hidden && failHide) { failHide = false; return failure('Hide temporarily unavailable'); }
          if (!input.hidden && failUndo) { failUndo = false; return failure('Restore temporarily unavailable'); }
          const next = { ...preference(id, userId), hidden: input.hidden };
          preferences.set(`${userId}:${id}`, next);
          data = next;
        } else {
          reportCalls++;
          if (failReport) { failReport = false; return failure('Report temporarily unavailable'); }
          await new Promise(resolve => setTimeout(resolve, 150));
          const key = `${userId}:${id}`;
          data = { id: 'report-receipt', alreadyReported: reports.has(key) };
          reports.add(key);
        }
      }
    }
    await reply(200, { success: true, data });
  });
  const card = id => page.locator(`#post-${id}`);
  const open = async id => { await card(id).getByRole('button', { name: 'Post options' }).click(); };
  const waitFor = async condition => {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (await condition()) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Timed out waiting for post action state');
  };
  const output = path.resolve(process.env.POST_ACTIONS_TEST_OUTPUT || path.join(os.tmpdir(), 'chattm-post-actions'));
  fs.mkdirSync(output, { recursive: true });
  try {
    await page.goto(base);
    await card('post-one').waitFor();
    await open('post-one');
    await page.getByRole('button', { name: 'Save post', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Save temporarily unavailable' }).waitFor();
    assert.equal(preference('post-one').saved, false);
    await page.getByRole('button', { name: 'Save post', exact: true }).dblclick();
    await waitFor(() => preference('post-one').saved);
    assert.equal(saveCalls, 2, 'One failed save plus one double-click guarded retry');
    await page.reload();
    await open('post-one');
    await page.getByRole('button', { name: 'Remove from Saved', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await open('post-two');
    await page.getByRole('button', { name: 'Save post', exact: true }).click();
    await waitFor(() => preference('post-two').saved);
    console.log('PASS: Save failure, retry, double-click guard, and refresh state');

    await page.goto(base + '/saved');
    await page.getByRole('alert').filter({ hasText: 'Library temporarily unavailable' }).waitFor();
    failLibrary = false;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await card('post-two').waitFor();
    await page.getByRole('button', { name: 'Load more saved posts', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'More posts temporarily unavailable' }).waitFor();
    await page.getByRole('button', { name: 'Try loading more again', exact: true }).click();
    await card('post-one').waitFor();
    await page.screenshot({ path: path.join(output, 'saved-mobile.png'), animations: 'disabled' });
    await open('post-one');
    await page.getByRole('button', { name: 'Remove from Saved', exact: true }).click();
    await card('post-one').waitFor({ state: 'hidden' });
    await open('post-two');
    await page.getByRole('button', { name: 'Remove from Saved', exact: true }).click();
    await page.getByRole('heading', { name: 'No saved posts yet' }).waitFor();
    console.log('PASS: library error retry, pagination retry, and unsave removes cards');

    await page.goto(base);
    await open('post-one');
    await page.getByRole('button', { name: 'Hide post', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Hide temporarily unavailable' }).waitFor();
    assert.equal(preference('post-one').hidden, false);
    await page.getByRole('button', { name: 'Hide post', exact: true }).click();
    await card('post-one').getByRole('button', { name: 'Undo', exact: true }).waitFor();
    failUndo = true;
    await card('post-one').getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Restore temporarily unavailable' }).waitFor();
    await card('post-one').getByRole('button', { name: 'Undo', exact: true }).click();
    await card('post-one').getByRole('button', { name: 'Post options' }).waitFor();
    await open('post-one');
    await page.getByRole('button', { name: 'Hide post', exact: true }).click();
    await waitFor(() => preference('post-one').hidden);
    await page.reload();
    await card('post-two').waitFor();
    assert.equal(await card('post-one').count(), 0);
    await page.goto(base + '/saved?view=hidden');
    await card('post-one').waitFor();
    await page.screenshot({ path: path.join(output, 'hidden-mobile.png'), animations: 'disabled' });
    await open('post-one');
    await page.getByRole('button', { name: 'Unhide post', exact: true }).click();
    await page.getByRole('heading', { name: 'No hidden posts', exact: true }).waitFor();
    console.log('PASS: Hide and Undo failures retain state; hidden library restores posts');

    await page.goto(base);
    await open('post-one');
    await page.getByRole('button', { name: 'Report post', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Report post', exact: true });
    await dialog.waitFor();
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 380 });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    const keyboardBox = await dialog.boundingBox();
    assert.ok(keyboardBox.y >= 0 && keyboardBox.y + keyboardBox.height <= 380, 'Report remains within simulated keyboard viewport');
    await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
    await page.getByRole('radio', { name: 'Something else' }).check();
    await page.getByRole('button', { name: 'Submit report', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'at least 10 characters' }).waitFor();
    assert.equal(reportCalls, 0);
    const details = page.getByRole('textbox', { name: 'Describe the issue (required)' });
    await details.fill('Please review the misleading claims in this post.');
    await page.getByRole('button', { name: 'Try submitting again', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Report temporarily unavailable' }).waitFor();
    assert.equal(await details.inputValue(), 'Please review the misleading claims in this post.');
    assert.equal(await page.getByRole('radio', { name: 'Something else' }).isChecked(), true);
    await page.screenshot({ path: path.join(output, 'report-mobile.png'), animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 500 });
    await page.getByRole('button', { name: 'Try submitting again', exact: true }).dblclick();
    await page.getByRole('heading', { name: 'Report received', exact: true }).waitFor();
    assert.equal(reportCalls, 2);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await open('post-one');
    await page.getByRole('button', { name: 'Report post', exact: true }).click();
    await page.getByRole('radio', { name: 'Spam', exact: true }).check();
    await page.getByRole('button', { name: 'Submit report', exact: true }).click();
    await page.getByRole('status').filter({ hasText: "You've already reported this post" }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    console.log('PASS: report validation, error retention, retry, duplicate receipt and keyboard dismissal');

    await page.setViewportSize({ width: 1440, height: 1000 });
    await open('own-post');
    assert.equal(await page.getByRole('button', { name: 'Hide post', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Report post', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Save post', exact: true }).click();
    await waitFor(() => preference('own-post').saved);
    await page.goto(base + '/saved');
    await card('own-post').waitFor();
    await page.screenshot({ path: path.join(output, 'saved-desktop.png'), animations: 'disabled' });
    activeUser = { ...viewer, id: 'actions-second-viewer', username: 'second', firstName: 'Neha' };
    await page.evaluate(user => { localStorage.setItem('chattm_user', JSON.stringify(user)); window.dispatchEvent(new Event('chattm:user-updated')); }, activeUser);
    await page.getByRole('heading', { name: 'No saved posts yet' }).waitFor();
    assert.equal(await card('own-post').count(), 0);
    console.log('PASS: own-post actions and account-specific library reset');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(runtimeErrors, []);
    console.log('PASS: no horizontal overflow or browser runtime errors');
    console.log('Screenshots: ' + output);
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'failure.png'), animations: 'disabled' }).catch(() => undefined);
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
