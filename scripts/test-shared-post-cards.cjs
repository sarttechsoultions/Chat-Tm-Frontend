// Mocked localhost accounts/messages only. Screenshots use generated local test media.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const ts = require('typescript');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.COMPOSER_TEST_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Localhost only');

const helper = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/sharedPost.ts'),'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: helper.exports, URL });
const { sharedPostReference, sharedVideoPoster } = helper.exports;
assert.equal(sharedPostReference('https://untrusted.example/posts/secret',base),null);
assert.equal(sharedPostReference(base+'.untrusted.example/posts/secret',base),null);
assert.equal(sharedPostReference(base+'/profile/author?postId=../secret',base),null);
assert.deepEqual(JSON.parse(JSON.stringify(sharedPostReference('My note\n\nShared a post from Author\n\nOLD PRIVATE CAPTION\n\n'+base+'/profile/author#post-safe-id',base))), { postId:'safe-id',note:'My note',href:'/posts/safe-id' });
assert.equal(sharedVideoPoster('https://res.cloudinary.com/demo/video/upload/v1/clip.mp4'),'https://res.cloudinary.com/demo/video/upload/so_0,w_480,c_limit,q_auto/v1/clip.jpg');
assert.equal(sharedVideoPoster('https://untrusted.example/video/upload/clip.mp4'),null);
assert.equal(sharedVideoPoster('https://res.cloudinary.com/demo/video/upload/s--signed--/clip.mp4'),null);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const viewer = { id: 'preview-viewer', username: 'viewer', firstName: 'Asha', lastName: 'Test', role: 'USER', avatar: '', isVerified: false };
  const author = { ...viewer, id: 'preview-author', username: 'ravi.creates', firstName: 'Ravi', isVerified: true };
  const friends = Array.from({ length: 9 }, (_, i) => ({ ...viewer, id: `friend-${i}`, firstName: ['Neha','Kabir','Anurita','Manish','Divya','Salman','Riya','Arjun','Meera'][i] }));
  const makePost = (id, video = false) => ({ id, body: 'A little moment worth sharing.', heading: '', privacy: 'FRIENDS', location: '', feeling: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), edited: false, author, media: [{ id: `${id}-media`, type: video ? 'video' : 'image', url: video ? 'https://res.cloudinary.com/fixture/video/upload/v1/reel.mp4' : '/fixture-preview/photo.svg', sortOrder: 0 }], mentions: [], likedBy: [], likesCount: 12, commentsCount: 0, sharesCount: 2, liked: false });
  const photo = makePost('preview-photo'), reel = makePost('preview-reel', true);
  const messages = [
    { id: 'photo-message', postId: photo.id, senderId: author.id },
    { id: 'reel-message', postId: reel.id, senderId: viewer.id },
    { id: 'denied-message', postId: 'preview-denied', senderId: author.id },
    { id: 'retry-message', postId: 'preview-retry', senderId: viewer.id },
  ].map((item, i) => ({ ...item, conversationId: 'preview-chat', body: `Shared a post on ChatTm\n\n${base}/posts/${item.postId}`, type: 'TEXT', createdAt: new Date(Date.now() - (4-i)*60000).toISOString(), sender: item.senderId === viewer.id ? viewer : author, readBy: [], isDeleted: false }));
  const chat = { id: 'preview-chat', type: 'DIRECT', members: [{ userId: viewer.id, user: viewer }, { userId: author.id, user: author }], messages: [messages[3]] };
  let failFriends = true, sheetOpen = false, failDelivery = true, failPreview = true, activeUser = viewer;
  const deliveries = new Map(), attempts = [], errors = [], requested = [];
  const page = await context.newPage();
  await context.addCookies([{ name: 'chattm_session', value: 'fixture.test.token', url: base }, { name: 'chattm_role', value: 'USER', url: base }]);
  await context.addInitScript(user => {
    localStorage.setItem('chattm_session','fixture.test.token'); localStorage.setItem('chattm_user',JSON.stringify(user));
    Object.defineProperty(navigator,'share',{ configurable:true, value:async payload => { window.lastShare = payload; } });
    Object.defineProperty(navigator,'clipboard',{ configurable:true, value:{ writeText:async value => { window.lastCopy = value; } } });
  }, viewer);
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname.startsWith('/socket.io')) return route.abort();
    if (url.hostname === 'res.cloudinary.com') {
      if (!url.pathname.endsWith('.jpg')) { if (new URL(page.url()).pathname === '/messenger') errors.push('Chat requested a video instead of a poster'); return route.fulfill({status:204}); }
      return route.fulfill({ status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="426"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#2b6e77"/><stop offset="1" stop-color="#e7a36c"/></linearGradient></defs><rect width="240" height="426" fill="url(#g)"/><text x="22" y="230" fill="white" font-family="sans-serif" font-size="23">A little moment</text><text x="60" y="260" fill="white" font-family="sans-serif" font-size="14">RAVI CREATES</text></svg>' });
    }
    if (url.pathname === '/fixture-preview/photo.svg') return route.fulfill({ status:200, contentType:'image/svg+xml', body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#e2cfaa"/><circle cx="460" cy="150" r="65" fill="#fff4cf"/><path d="M0 370L180 190L380 430L600 300V600H0Z" fill="#5b7c72"/><path d="M0 470L240 350L600 490V600H0Z" fill="#284f4d"/><text x="40" y="545" fill="white" font-size="24" font-family="sans-serif">A moment outdoors</text></svg>' });
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const headers = { 'access-control-allow-origin':base,'access-control-allow-credentials':'true','access-control-allow-headers':'*','access-control-allow-methods':'*' };
    const reply = (status,json) => route.fulfill({ status,headers,json });
    if (req.method() === 'OPTIONS') return route.fulfill({ status:204,headers });
    let data = { items:[],hasMore:false,nextCursor:null,commentsCount:0,unreadCount:0 };
    if (url.pathname.endsWith('/auth/me')) data = { user:activeUser };
    else if (url.pathname.endsWith('/friends')) { if (failFriends && sheetOpen) return reply(503,{message:'Fixture friends failure'}); data = { items:friends }; }
    else if (url.pathname.endsWith('/conversations/direct')) data = { id: 'chat-' + req.postDataJSON().targetUserId };
    else if (url.pathname.endsWith('/conversations')) data = [chat];
    else if (url.pathname.endsWith('/messages/preview-chat')) data = messages;
    else if (url.pathname.match(/\/messages\/chat-friend-/)) {
      const input = req.postDataJSON(); attempts.push({ path:url.pathname,...input });
      deliveries.set(input.clientMessageId,input);
      if (url.pathname.endsWith('friend-1') && failDelivery) { failDelivery=false; return reply(503,{message:'Uncertain delivery'}); }
      data = { id:input.clientMessageId };
    } else if (url.pathname.endsWith('/posts')) data = { items:[photo],hasMore:false,nextCursor:null };
    else if (url.pathname.endsWith('/share')) data = url.pathname.includes(reel.id) ? reel : photo;
    else {
      const match = url.pathname.match(/\/posts\/(preview-[^/]+)$/);
      if (match) {
        const id = match[1]; requested.push(id);
        if (id === 'preview-denied' || activeUser.id !== viewer.id) return reply(404,{message:'Post not found'});
        if (id === 'preview-retry' && failPreview) return reply(503,{message:'Preview failure'});
        data = id === reel.id ? reel : { ...photo,id };
      }
    }
    return reply(200,{success:true,data});
  });
  page.on('pageerror',error => errors.push(error.message));
  const output = path.resolve(process.env.POST_PREVIEW_TEST_OUTPUT || path.join(os.tmpdir(),'chattm-shared-previews'));
  fs.mkdirSync(output,{recursive:true});
  try {
    await page.goto(base + '/posts/preview-photo');
    await page.locator('#post-preview-photo').waitFor();
    sheetOpen = true;
    await page.locator('#post-preview-photo').getByRole('button',{name:'Share',exact:true}).click();
    const sheet = page.getByRole('dialog',{name:'Share post'});
    await sheet.getByRole('button',{name:'Retry friends'}).waitFor();
    failFriends = false;
    await sheet.getByRole('button',{name:'Retry friends'}).click();
    await sheet.getByRole('button',{name:'Select Neha Test'}).waitFor();
    await page.screenshot({path:path.join(output,'share-sheet-mobile.png')});
    await sheet.getByRole('textbox',{name:'Search friends to share with'}).fill('Kabir');
    assert.equal(await sheet.getByRole('button',{name:/^Select /}).count(),1);
    await sheet.getByRole('textbox',{name:'Search friends to share with'}).fill('');
    await sheet.getByRole('button',{name:'Select Neha Test'}).click();
    await sheet.getByRole('button',{name:'Select Kabir Test'}).click();
    await sheet.getByRole('textbox',{name:'Add a message to your share'}).fill('You will love this');
    await sheet.getByRole('button',{name:'Send (2)',exact:true}).dblclick();
    await sheet.getByRole('alert').filter({hasText:'Couldn’t send to 1 person'}).waitFor();
    await sheet.getByRole('button',{name:'Send (1)',exact:true}).click();
    await sheet.getByRole('status').filter({hasText:'Sent to 1 person.'}).waitFor();
    assert.equal(attempts.length,3); assert.equal(deliveries.size,2);
    assert.equal(attempts[1].clientMessageId,attempts[2].clientMessageId,'Uncertain delivery retry reuses its key');
    for (const delivery of deliveries.values()) { assert(!delivery.mediaUrl); assert(!delivery.body.includes(photo.body)); assert(delivery.body.includes(base+'/posts/preview-photo')); }
    await sheet.getByRole('button',{name:'Copy link',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.lastCopy),base+'/posts/preview-photo');
    await sheet.getByRole('button',{name:'Share',exact:true}).click();
    assert(!(await page.evaluate(()=>window.lastShare.text)).includes(photo.body));
    await page.setViewportSize({width:1440,height:900});
    await page.screenshot({path:path.join(output,'share-sheet-desktop.png')});
    await page.setViewportSize({width:390,height:500});
    await sheet.getByRole('button',{name:'Select Anurita Test'}).click();
    await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:380});visualViewport.dispatchEvent(new Event('resize'));});
    const sendBox = await sheet.getByRole('button',{name:'Send (1)',exact:true}).boundingBox();
    assert(sendBox.y >= 0 && sendBox.y + sendBox.height <= 380,'Send remains above the keyboard');
    await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
    await page.keyboard.press('Escape');
    await sheet.waitFor({state:'hidden'});
    await page.setViewportSize({width:390,height:844});
    console.log('PASS: friends retry/search/grid, multi-send, partial failure, idempotent retry, safe payloads and Escape');

    await page.goto(base+'/messenger?chatId=preview-chat');
    const photoCard = page.locator('[data-shared-post="preview-photo"]');
    await photoCard.scrollIntoViewIfNeeded();
    await photoCard.getByRole('link',{name:'Open post by ravi.creates'}).waitFor();
    await photoCard.locator('img[alt="Shared post"]').waitFor();
    await page.screenshot({path:path.join(output,'shared-photo-mobile.png')});
    const reelCard = page.locator('[data-shared-post="preview-reel"]');
    await reelCard.scrollIntoViewIfNeeded();
    await reelCard.getByRole('link',{name:'Open reel by ravi.creates'}).waitFor();
    await page.waitForTimeout(400);
    assert.equal(await reelCard.locator('video').count(),0);
    await reelCard.getByAltText('Reel thumbnail').waitFor();
    await page.screenshot({path:path.join(output,'shared-reel-mobile.png')});
    await reelCard.getByRole('link').click();
    await page.waitForURL(base+'/watch?reel=preview-reel');
    await page.getByRole('button',{name:'Like reel'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Like reel'}).count(),1,'A shared reel outside the feed still opens directly');
    await page.goto(base+'/messenger?chatId=preview-chat');
    const denied = page.locator('[data-shared-post="preview-denied"]');
    await denied.scrollIntoViewIfNeeded(); await denied.getByText('Post unavailable',{exact:true}).waitFor();
    assert.equal(await denied.locator('img,video').count(),0);
    const retry = page.locator('[data-shared-post="preview-retry"]');
    await retry.scrollIntoViewIfNeeded(); await retry.getByRole('button',{name:'Retry preview'}).waitFor();
    failPreview=false; await retry.getByRole('button',{name:'Retry preview'}).click();
    await retry.getByRole('link',{name:'Open post by ravi.creates'}).waitFor();
    assert(!await page.getByText('Shared a post on ChatTm',{exact:true}).count());
    await photoCard.scrollIntoViewIfNeeded();
    await photoCard.getByRole('link').click();
    await page.waitForURL(base+'/posts/preview-photo');
    await page.goto(base+'/posts/preview-reel');
    await page.locator('#post-preview-reel').waitFor();
    const feedMedia = page.locator('#post-preview-reel video').locator('..').locator('..');
    const feedBox = await feedMedia.boundingBox();
    assert(Math.abs(feedBox.width / feedBox.height - 0.8) < 0.02,'Feed reel uses portrait proportions');
    await page.locator('#post-preview-reel').getByRole('button',{name:'Share',exact:true}).click();
    await page.getByRole('dialog',{name:'Share reel'}).waitFor();
    await page.keyboard.press('Escape');
    activeUser={...viewer,id:'different-account'};
    await page.goto(base+'/messenger?chatId=preview-chat');
    await page.evaluate(user=>{localStorage.setItem('chattm_user',JSON.stringify(user));window.dispatchEvent(new Event('storage'));},activeUser);
    const cleared = page.locator('[data-shared-post="preview-photo"]');
    await cleared.scrollIntoViewIfNeeded(); await cleared.getByText('Post unavailable',{exact:true}).waitFor();
    assert.equal(await cleared.locator('img,video').count(),0);
    assert.deepEqual(errors,[]);
    console.log('PASS: image/reel cards, play affordance without autoplay, audience denial, preview retry, tap-through and account isolation');
    console.log('Previews: '+output);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
