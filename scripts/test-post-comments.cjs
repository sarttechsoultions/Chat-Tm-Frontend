// Local UI tests with mocked APIs and isolated browser accounts.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.COMPOSER_TEST_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Use localhost only.');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const writer = { id: 'comment-writer', username: 'asha', firstName: 'Asha', lastName: 'Test', role: 'USER', avatar: '', isVerified: false, referralCode: 'fixture' };
  const owner = { ...writer, id: 'post-owner', username: 'ravi', firstName: 'Ravi' };
  let activeUser = writer;
  let video = false;
  const makeComment = (id, author = writer, parentId = null) => ({
    id, postId: 'comments-post', parentId, body: `Original ${id}`, author, createdAt: '2026-10-24T10:00:00Z', edited: false, deleted: false, visible: true, liked: false, likesCount: 0,
  });
  let comments = [makeComment('own-root'), makeComment('other-root', owner), makeComment('older-root')];
  let replies = Array.from({ length: 5 }, (_, i) => makeComment(`reply-${i}`, i % 2 ? owner : writer, 'own-root'));
  let failInitial = true, failMore = true, failReplies = true, failEdit = true, failDelete = true, failLike = true, failCreate = true;
  let edits = 0, creates = 0;
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const activeCount = () => comments.filter(comment => !comment.deleted).length + replies.length;
  const mappedRoot = root => {
    const children = replies.filter(reply => reply.parentId === root.id);
    return { ...root, author: root.deleted ? null : root.author, body: root.deleted ? '' : root.body,
      replies: children.slice(0, 3), repliesCount: children.length, repliesHasMore: children.length > 3,
      repliesNextCursor: children.length > 3 ? 'reply-cursor' : null };
  };
  const post = () => ({ id: 'comments-post', body: 'A conversation worth having', heading: 'Community moments', privacy: 'PUBLIC', location: '', feeling: '', author: owner,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), edited: false,
    mentions: [], media: video ? [{ id: 'video', url: 'https://example.invalid/fixture.mp4', type: 'video', sortOrder: 0 }] : [], likesCount: 0, commentsCount: activeCount(), sharesCount: 0, liked: false, likedBy: [] });
  await context.addCookies([{ name: 'chattm_session', value: 'fixture.test.token', url: base }, { name: 'chattm_role', value: 'USER', url: base }]);
  await context.addInitScript(user => {
    if (!localStorage.getItem('chattm_user')) localStorage.setItem('chattm_user', JSON.stringify(user));
    localStorage.setItem('chattm_session', 'fixture.test.token');
  }, writer);
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.startsWith('/socket.io') || url.hostname === 'example.invalid') return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const fail = message => route.fulfill({ status: 503, headers, json: { message } });
    let data = { items: [], hasMore: false, nextCursor: null, count: 0, unreadCount: 0 };
    if (url.pathname.endsWith('/auth/me')) data = { user: activeUser };
    else if (url.pathname.endsWith('/posts')) data = { items: [post()], hasMore: false, nextCursor: null };
    else if (url.pathname.endsWith('/comments') && request.method() === 'GET') {
      if (failInitial) return fail('Comments temporarily unavailable');
      const next = url.searchParams.get('cursor');
      if (next && failMore) { failMore = false; return fail('Older comments temporarily unavailable'); }
      const roots = comments.filter(comment => !comment.deleted || replies.some(reply => reply.parentId === comment.id));
      data = next ? { items: roots.slice(2).map(mappedRoot), nextCursor: null, hasMore: false, commentsCount: activeCount() }
        : { items: roots.slice(0, 2).map(mappedRoot), nextCursor: roots.length > 2 ? 'comment-cursor' : null, hasMore: roots.length > 2, commentsCount: activeCount() };
    } else if (url.pathname.endsWith('/comments') && request.method() === 'POST') {
      creates++;
      if (failCreate) { failCreate = false; return fail('Posting temporarily unavailable'); }
      await new Promise(resolve => setTimeout(resolve, 100));
      const input = request.postDataJSON();
      const created = { ...makeComment('new-comment-' + creates, activeUser, input.parentId || null), body: input.body };
      if (created.parentId) replies.push(created);
      else comments.unshift(created);
      data = { ...created, commentsCount: activeCount(), parentRepliesCount: replies.filter(reply => reply.parentId === created.parentId).length };
    } else {
      const match = url.pathname.match(/\/comments\/([^/]+)(?:\/(replies|like))?$/);
      if (match) {
        const [, id, action] = match;
        const comment = [...comments, ...replies].find(item => item.id === id);
        if (action === 'replies') {
          if (failReplies) { failReplies = false; return fail('Replies temporarily unavailable'); }
          const all = replies.filter(reply => reply.parentId === id);
          data = { items: url.searchParams.has('cursor') ? all.slice(3) : all, repliesCount: all.length, hasMore: false, nextCursor: null };
        } else if (action === 'like') {
          if (failLike) { failLike = false; return fail('Like temporarily unavailable'); }
          comment.liked = !comment.liked;
          comment.likesCount = comment.liked ? 1 : 0;
          data = { id, liked: comment.liked, likesCount: comment.likesCount };
        } else if (request.method() === 'PATCH') {
          edits++;
          if (failEdit) { failEdit = false; return fail('Edit temporarily unavailable'); }
          await new Promise(resolve => setTimeout(resolve, 100));
          comment.body = request.postDataJSON().body;
          comment.edited = true;
          data = { commentId: id, parentId: comment.parentId, comment: { ...comment }, repliesCount: replies.filter(reply => reply.parentId === comment.parentId).length, commentsCount: activeCount() };
        } else if (request.method() === 'DELETE') {
          if (failDelete) { failDelete = false; return fail('Delete temporarily unavailable'); }
          if (comment.parentId) replies = replies.filter(reply => reply.id !== id);
          else { comment.deleted = true; comment.body = ''; }
          data = { commentId: id, parentId: comment.parentId, comment: !comment.parentId && replies.some(reply => reply.parentId === id) ? mappedRoot(comment) : null,
            repliesCount: replies.filter(reply => reply.parentId === comment.parentId).length, commentsCount: activeCount() };
        }
      }
    }
    await route.fulfill({ headers, json: { success: true, data } });
  });
  const row = id => page.locator(`[data-comment-id="${id}"]`);
  const waitFor = async condition => {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) { if (await condition()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
    throw new Error('Timed out waiting for comment state');
  };
  const output = path.resolve(process.env.POST_COMMENTS_TEST_OUTPUT || path.join(os.tmpdir(), 'chattm-post-comments'));
  fs.mkdirSync(output, { recursive: true });
  try {
    await page.goto(base);
    const card = page.locator('#post-comments-post');
    await card.getByRole('button', { name: 'Comment', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Comments temporarily unavailable' }).waitFor();
    failInitial = false;
    await page.getByRole('button', { name: 'Try loading comments again' }).click();
    await row('own-root').waitFor();
    assert.equal(await row('own-root').getByRole('button', { name: 'Edit', exact: true }).count(), 1);
    assert.equal(await row('other-root').getByRole('button', { name: 'Edit', exact: true }).count(), 0);
    assert.equal(await row('other-root').getByRole('button', { name: 'Delete', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Load more comments', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Older comments temporarily unavailable' }).waitFor();
    await page.getByRole('button', { name: 'Try loading more comments again' }).click();
    await row('older-root').waitFor();
    console.log('PASS: initial and older comment failures retry without losing existing comments');

    await row('own-root').getByRole('button', { name: 'Edit', exact: true }).click();
    const editor = row('own-root').getByRole('textbox', { name: 'Edit comment text' });
    await editor.fill('My corrected comment');
    await row('own-root').getByRole('button', { name: 'Save changes', exact: true }).click();
    await row('own-root').getByRole('alert').filter({ hasText: 'Edit temporarily unavailable' }).waitFor();
    assert.equal(await editor.inputValue(), 'My corrected comment');
    await row('own-root').getByRole('button', { name: 'Save changes', exact: true }).dblclick();
    await row('own-root').getByText('My corrected comment', { exact: true }).waitFor();
    await row('own-root').getByText('Edited', { exact: true }).waitFor();
    assert.equal(edits, 2);
    await row('own-root').getByRole('button', { name: 'Like comment', exact: true }).click();
    await row('own-root').getByRole('alert').filter({ hasText: 'Like temporarily unavailable' }).waitFor();
    assert.equal(comments[0].liked, false);
    await row('own-root').getByRole('button', { name: 'Like comment', exact: true }).click();
    await row('own-root').getByRole('button', { name: 'Unlike comment', exact: true }).waitFor();
    console.log('PASS: failed edits retain text, retry saves once, and failed likes retain state');

    await page.getByRole('button', { name: 'View 5 replies', exact: true }).click();
    await row('reply-0').waitFor();
    await page.getByRole('button', { name: 'Load more replies', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Replies temporarily unavailable' }).waitFor();
    await page.getByRole('button', { name: 'Try loading replies again' }).click();
    await row('reply-4').waitFor();
    assert.equal(await page.locator('[data-comment-id^="reply-"]').count(), 5);
    await row('reply-0').getByRole('button', { name: 'Edit', exact: true }).click();
    await row('reply-0').getByRole('textbox', { name: 'Edit reply text' }).fill('Corrected reply');
    await row('reply-0').getByRole('button', { name: 'Save changes', exact: true }).click();
    await row('reply-0').getByText('Corrected reply', { exact: true }).waitFor();
    console.log('PASS: reply pagination retries, avoids duplicates and supports reply editing');

    const draft = page.getByRole('textbox', { name: 'Write a comment', exact: true });
    await draft.fill('Keep this draft when collapsed');
    await card.getByRole('button', { name: 'Comment', exact: true }).click();
    await card.getByRole('button', { name: 'Comment', exact: true }).click();
    assert.equal(await draft.inputValue(), 'Keep this draft when collapsed');
    await page.getByRole('button', { name: 'Post comment', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Posting temporarily unavailable' }).waitFor();
    assert.equal(await draft.inputValue(), 'Keep this draft when collapsed');
    await page.getByRole('button', { name: 'Try posting again', exact: true }).dblclick();
    await row('new-comment-2').waitFor();
    assert.equal(creates, 2);
    await card.getByRole('button', { name: '9 Comments', exact: true }).waitFor();
    console.log('PASS: collapsed drafts survive; failed submissions retain text and retries update counts once');

    await row('own-root').getByRole('button', { name: 'Delete', exact: true }).click();
    await row('own-root').getByRole('button', { name: 'Keep comment', exact: true }).click();
    assert.equal(await row('own-root').getByText('My corrected comment', { exact: true }).count(), 1);
    await row('own-root').getByRole('button', { name: 'Delete', exact: true }).click();
    await row('own-root').getByRole('button', { name: 'Confirm delete', exact: true }).click();
    await row('own-root').getByRole('alert').filter({ hasText: 'Delete temporarily unavailable' }).waitFor();
    await row('own-root').getByRole('button', { name: 'Confirm delete', exact: true }).click();
    await row('own-root').getByText(/This comment was deleted/).waitFor();
    assert.equal(await row('reply-4').count(), 1);
    assert.equal(await row('own-root').getByRole('button', { name: 'Edit', exact: true }).count(), 0);
    await card.getByRole('button', { name: '8 Comments', exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'comments-mobile.png'), animations: 'disabled' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log('PASS: delete confirmation and retry preserve replies, redact the parent and update counts');

    activeUser = owner;
    await page.evaluate(user => { localStorage.setItem('chattm_user', JSON.stringify(user)); window.dispatchEvent(new Event('chattm:user-updated')); }, activeUser);
    await waitFor(async () => await row('new-comment-2').count() === 0);
    await card.getByRole('button', { name: 'Comment', exact: true }).click();
    await waitFor(async () => await row('new-comment-2').getByRole('button', { name: 'Delete', exact: true }).count() === 1);
    assert.equal(await row('new-comment-2').getByRole('button', { name: 'Edit', exact: true }).count(), 0);
    console.log('PASS: post owner can delete other comments but cannot edit them');

    activeUser = writer;
    comments = [makeComment('reel-root')]; replies = []; video = true;
    await page.evaluate(user => localStorage.setItem('chattm_user', JSON.stringify(user)), activeUser);
    await page.goto(base + '/watch');
    await page.getByRole('button', { name: 'Show comments', exact: true }).click();
    await row('reel-root').waitFor();
    await row('reel-root').getByRole('button', { name: 'Edit', exact: true }).click();
    await row('reel-root').getByRole('textbox', { name: 'Edit comment text' }).fill('Edited from reels');
    await row('reel-root').getByRole('button', { name: 'Save changes', exact: true }).click();
    await row('reel-root').getByText('Edited from reels', { exact: true }).waitFor();
    await page.getByRole('textbox', { name: 'Write a comment', exact: true }).fill('Another reel comment');
    await page.getByRole('button', { name: 'Post comment', exact: true }).click();
    await row('new-comment-3').waitFor();
    await page.getByRole('heading', { name: 'Comments 2', exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 500 });
    let actionBox = await page.getByRole('button', { name: 'Post comment', exact: true }).boundingBox();
    assert.ok(actionBox.y + actionBox.height <= 500, 'Reel comment action remains visible on short screens');
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 360 });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    actionBox = await page.getByRole('button', { name: 'Post comment', exact: true }).boundingBox();
    assert.ok(actionBox.y + actionBox.height <= 360, 'Reel comment action remains above a simulated mobile keyboard');
    await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
    await page.screenshot({ path: path.join(output, 'reel-comments-mobile.png'), animations: 'disabled' });
    console.log('PASS: reels share comment edit/create flow and canonical counts');
    assert.deepEqual(errors, []);
    console.log('PASS: no browser runtime errors');
    console.log('Screenshots: ' + output);
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'failure.png'), animations: 'disabled' }).catch(() => undefined);
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
