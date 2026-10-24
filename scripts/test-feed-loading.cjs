// Local browser fixtures only; no real accounts or media uploads.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.COMPOSER_TEST_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Localhost only');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const user = { id: 'feed-viewer', username: 'viewer', firstName: 'Test', lastName: 'Viewer', avatar: '', role: 'USER', isVerified: false };
  let activeUser = user, moreCalls = 0;
  const mediaRequests = new Set(), errors = [];
  const posts = Array.from({ length: 20 }, (_, i) => ({ id: `feed-${i}`, body: `Moment ${i}`, heading: '', privacy: 'PUBLIC', location: '', feeling: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), edited: false, author: { ...user, id: 'feed-author' }, mentions: [], media: [{ id: `media-${i}`, type: 'image', url: `/fixture-media/${i}.svg`, sortOrder: 0 }, ...(i === 0 ? [{ id: 'fixture-video', type: 'video', url: '/fixture-media/video.mp4', sortOrder: 1 }] : [])], likedBy: [], likesCount: 0, commentsCount: 0, sharesCount: 0, liked: false }));
  await context.addCookies([{ name: 'chattm_session', value: 'fixture.test.token', url: base }, { name: 'chattm_role', value: 'USER', url: base }]);
  await context.addInitScript(value => { localStorage.setItem('chattm_user', JSON.stringify(value)); localStorage.setItem('chattm_session', 'fixture.test.token'); }, user);
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname.startsWith('/socket.io')) return route.abort();
    if (url.pathname.startsWith('/fixture-media/')) {
      mediaRequests.add(url.pathname);
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="604" height="604"><rect width="604" height="604" fill="#cde5e5"/></svg>' });
    }
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const reply = (status, json) => route.fulfill({ status, headers, json });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let data = { items: [], hasMore: false, nextCursor: null, unreadCount: 0 };
    if (url.pathname.endsWith('/auth/me')) data = { user: activeUser };
    else if (url.pathname.endsWith('/posts')) {
      if (activeUser.id !== user.id) data = { items: [], hasMore: false, nextCursor: null };
      else if (url.searchParams.has('cursor')) {
        moreCalls++;
        if (moreCalls === 1) return reply(503, { message: 'Fixture interruption' });
        await new Promise(resolve => setTimeout(resolve, 350));
        data = { items: posts.slice(9), hasMore: false, nextCursor: null };
      } else data = { items: posts.slice(0, 10), hasMore: true, nextCursor: 'fixture-next' };
    }
    return reply(200, { success: true, data });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(base);
    await page.locator('#post-feed-0').waitFor();
    assert.equal(await page.locator('#post-feed-0 img[src*="fixture-media"]').getAttribute('loading'), 'lazy');
    assert.equal(await page.locator('#post-feed-0 img[src*="fixture-media"]').getAttribute('decoding'), 'async');
    assert.equal(await page.locator('#post-feed-0 video').getAttribute('preload'), 'none');
    assert(!mediaRequests.has('/fixture-media/video.mp4'), 'Inactive video must not preload');
    assert(!mediaRequests.has('/fixture-media/9.svg'), 'Distant images must not download on first render');
    await page.locator('#post-feed-9').scrollIntoViewIfNeeded();
    await page.getByRole('alert').filter({ hasText: 'Couldn’t load more posts' }).waitFor();
    await page.waitForTimeout(700);
    assert.equal(moreCalls, 1, 'Failed load must wait for explicit retry');
    assert.equal(await page.locator('#post-feed-0').count(), 1, 'Existing feed remains mounted');
    await page.getByRole('button', { name: 'Try loading more again' }).dblclick();
    await page.locator('#post-feed-19').waitFor();
    assert.equal(moreCalls, 2, 'Retry is guarded against duplicate requests');
    assert.equal(await page.locator('#post-feed-9').count(), 1, 'Overlapping pages deduplicate');
    await page.locator('#post-feed-19').scrollIntoViewIfNeeded();
    await page.getByText("You're all caught up!").waitFor();
    activeUser = { ...user, id: 'feed-other-account' };
    await page.evaluate(value => { localStorage.setItem('chattm_user', JSON.stringify(value)); window.dispatchEvent(new Event('storage')); }, activeUser);
    await page.getByText('No posts yet', { exact: true }).waitFor();
    assert.equal(await page.locator('[id^="post-feed-"]').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: deferred media, pagination failure/retry, duplicate guard, dedupe and account reset');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
