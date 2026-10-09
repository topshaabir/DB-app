const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const dist = path.join(__dirname, '../client/dist');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const file = path.join(dist, new URL(req.url, 'http://localhost').pathname);
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(dist, 'index.html');
  res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
const topic = { id: 5, chapterId: 2, chapterTitle: 'Food and cooking', title: 'Vocabulary', orderIndex: 1 };
const chapter = { id: 2, title: 'Food and cooking', description: 'Еда и приготовление пищи', orderIndex: 1, topics: [topic] };
const entries = ['Aruzhan', 'Dias', 'A very long learner name that must wrap correctly', 'Madi'].map((userName, index) => ({
  rank: index + 1, userName, points: 125 - index * 20, accuracy: 92 - index * 5, completedTests: 6, lastCompletedAt: new Date().toISOString()
}));

(async () => {
  await new Promise(resolve => server.listen(5185, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: process.env.CHECK_BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }, { width: 320, height: 667 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      const rankingRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/**', async route => {
        const url = new URL(route.request().url());
        let data;
        if (url.pathname === '/api/leaderboard') {
          rankingRequests.push(url.search);
          data = url.searchParams.get('period') === 'week' ? { totalPlayers: 0, totalTests: 0, entries: [] } : { totalPlayers: 4, totalTests: 24, entries };
        } else if (url.pathname === '/api/topics') data = [topic];
        else if (url.pathname === '/api/chapters') data = [chapter];
        else if (url.pathname === '/api/topics/5') data = { ...topic, vocabulary: [{ id: 1, topicId: 5, word: 'apple', translation: 'яблоко', exampleSentence: '' }] };
        else throw new Error(`Unexpected API call ${url.pathname}`);
        await route.fulfill({ json: data });
      });
      await page.goto('http://127.0.0.1:5185/leaderboard');
      await page.locator('.leaderboard-table tbody tr').last().waitFor();
      assert.equal(await page.locator('.leaderboard-table tbody tr').count(), 4);
      assert.equal(await page.locator('.podium-player').count(), 3);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (viewport.width < 980) assert.equal(await page.locator('.mobile-nav').getByRole('link', { name: 'Leaderboard' }).isVisible(), true);
      if (process.env.CHECK_SCREENSHOTS_DIR) await page.screenshot({ path: path.join(process.env.CHECK_SCREENSHOTS_DIR, `leaderboard-${viewport.width}.png`), fullPage: true });
      await page.getByRole('searchbox').fill('dias');
      assert.equal(await page.locator('.leaderboard-table tbody tr').count(), 1);
      assert.match(await page.locator('.leaderboard-table tbody tr').innerText(), /Dias/);
      await page.getByRole('searchbox').fill('no-such-learner');
      await page.getByText('No matching learners').waitFor();
      await page.getByRole('searchbox').fill('');
      await page.getByRole('combobox').selectOption('5');
      await page.locator('.leaderboard-table').waitFor();
      assert(rankingRequests.some(query => query.includes('topicId=5')));
      await page.getByRole('button', { name: 'Last 7 days' }).click();
      await page.getByText('No results yet').waitFor();
      await page.getByRole('button', { name: 'All time', exact: true }).click();
      await page.locator('.leaderboard-table').waitFor();
      const beforeRefresh = rankingRequests.length;
      await page.getByRole('button', { name: 'Refresh leaderboard' }).click();
      await page.locator('.leaderboard-table').waitFor();
      assert(rankingRequests.length > beforeRefresh);
      await page.goto('http://127.0.0.1:5185/topics');
      await page.locator('.topic-card').waitFor();
      assert.equal(await page.locator('.topic-card').count(), 1);
      assert.equal(await page.locator('.chapter-section').count(), 0);
      assert.equal(await page.locator('.topic-card strong').innerText(), 'Food and cooking');
      await page.locator('.topic-card').click();
      await page.getByRole('heading', { name: 'Food and cooking', exact: true }).waitFor();
      assert.equal(await page.locator('.loading-screen').count(), 0);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS ${viewport.width}: rankings, search, filters, refresh, empty state, mobile navigation and direct topic navigation`);
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
