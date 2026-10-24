// Isolated localhost fixtures; no live accounts or messages.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.COMPOSER_TEST_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Use localhost only');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const viewer = { id: 'share-viewer', username: 'viewer', firstName: 'Asha', lastName: 'Test', role: 'USER', avatar: '', isVerified: false };
  const author = { ...viewer, id: 'share-author', username: 'author', firstName: 'Ravi' };
  const friend = { ...viewer, id: 'share-friend', firstName: 'Neha' };
  const post = { id: 'shared-post', body: 'PRIVATE BODY MUST NEVER BE COPIED', heading: 'PRIVATE HEADING', privacy: 'FRIENDS', location: '', feeling: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), edited: false, author, media: [{ id: 'secret-media', type: 'image', url: '/private-secret.jpg', sortOrder: 0 }], mentions: [], likedBy: [], likesCount: 0, commentsCount: 0, sharesCount: 0, liked: false };
  let mode = 'allowed', activeUser = viewer, sent = null;
  const errors = [];
  await context.addCookies([{ name: 'chattm_session', value: 'fixture.test.token', url: base }, { name: 'chattm_role', value: 'USER', url: base }]);
  await context.addInitScript(user => {
    localStorage.setItem('chattm_session', 'fixture.test.token');
    localStorage.setItem('chattm_user', JSON.stringify(user));
    window.sharedPayload = null; window.copiedLink = null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.sharedPayload = data; } });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedLink = value; } } });
  }, viewer);
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname.startsWith('/socket.io')) return route.abort();
    if (url.pathname === '/private-secret.jpg') return route.fulfill({ status: 204 });
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const reply = (status, data) => route.fulfill({ status, headers, json: data });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let data = { items: [], hasMore: false, nextCursor: null, unreadCount: 0, commentsCount: 0 };
    if (url.pathname.endsWith('/auth/me')) data = { user: activeUser };
    else if (url.pathname.endsWith('/friends')) data = { items: [friend] };
    else if (url.pathname.endsWith('/posts/shared-post')) {
      if (mode !== 'allowed') return reply(mode === 'network' ? 503 : mode === 'missing' ? 404 : 403, { message: 'Fixture error' });
      data = post;
    } else if (url.pathname.endsWith('/share')) data = post;
    else if (url.pathname.endsWith('/conversations/direct')) data = { id: 'fixture-chat' };
    else if (url.pathname.endsWith('/messages/fixture-chat')) { sent = req.postDataJSON(); data = { id: 'fixture-message' }; }
    return reply(200, { success: true, data });
  });
  const page = await context.newPage();
  page.on('pageerror', err => errors.push(err.message));
  const card = page.locator('#post-shared-post');
  try {
    mode = 'network';
    await page.goto(base + '/posts/shared-post');
    await page.getByRole('alert').filter({ hasText: 'couldn’t load' }).waitFor();
    mode = 'allowed';
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await card.waitFor();
    await card.getByRole('button', { name: 'Post options' }).click();
    await page.getByRole('button', { name: 'Copy link', exact: true }).click();
    await page.waitForFunction(() => !!window.copiedLink);
    assert.equal(await page.evaluate(() => window.copiedLink), base + '/posts/shared-post');
    await card.getByRole('button', { name: 'Share', exact: true }).click();
    await page.getByRole('dialog', { name: 'Share post' }).getByRole('button', { name: 'Share', exact: true }).click();
    const payload = await page.evaluate(() => window.sharedPayload);
    assert.equal(payload.url, base + '/posts/shared-post');
    assert(!JSON.stringify(payload).includes('PRIVATE'));
    await page.getByRole('button', { name: 'Select Neha Test', exact: true }).click();
    await page.getByPlaceholder('Add a message (optional)').fill('Have a look');
    await page.getByRole('button', { name: 'Send (1)', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Sent to 1 person.' }).waitFor();
    await page.getByRole('button', { name: 'Close share' }).click();
    assert(sent.body.includes('Have a look') && sent.body.includes(base + '/posts/shared-post'));
    assert(!sent.body.includes('PRIVATE') && !sent.body.includes('Ravi'));
    assert(!sent.mediaUrl && !sent.fileName && !sent.type);
    console.log('PASS: direct link, network retry, native share and chat share contain no post snapshot');

    mode = 'denied'; activeUser = { ...viewer, id: 'other-viewer' };
    await page.evaluate(user => { localStorage.setItem('chattm_user', JSON.stringify(user)); window.dispatchEvent(new Event('storage')); }, activeUser);
    await page.getByRole('heading', { name: 'This post isn’t available' }).waitFor();
    assert.equal(await card.count(), 0);
    assert(!(await page.locator('body').innerText()).includes(post.body));
    mode = 'missing'; await page.reload();
    await page.getByRole('heading', { name: 'This post isn’t available' }).waitFor();
    await page.goto(base + '/profile/author?postId=shared-post');
    await page.waitForURL(base + '/posts/shared-post');
    await page.getByRole('heading', { name: 'This post isn’t available' }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: account switch clears post, denied/deleted posts reveal no content, legacy link resolves');
    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.goto(base + '/posts/shared-post');
    assert.equal(new URL(guestPage.url()).pathname, '/login');
    assert.equal(new URL(guestPage.url()).searchParams.get('next'), '/posts/shared-post');
    await guest.close();
    console.log('PASS: signed-out post link preserves destination for login');
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
