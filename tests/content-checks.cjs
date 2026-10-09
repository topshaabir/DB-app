const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = process.env.CHECK_LIVE_URL || 'http://127.0.0.1:5175';
const topicCounts = new Map([
  ['Public transport and vehicles', 10], ['On the road', 28], ['Phrasal verbs', 6],
  ['After verbs', 16], ['After adjectives', 19]
]);

(async () => {
  const browser = await chromium.launch({ channel: process.env.CHECK_BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/topics`);
      await page.locator('.chapter-section').filter({ has: page.getByRole('heading', { name: 'Transport', exact: true }) }).waitFor();
      const transport = page.locator('.chapter-section').filter({ has: page.getByRole('heading', { name: 'Transport', exact: true }) });
      const prepositions = page.locator('.chapter-section').filter({ has: page.getByRole('heading', { name: 'Dependent prepositions', exact: true }) });
      assert.equal(await transport.locator('.topic-card').count(), 3);
      assert.equal(await prepositions.locator('.topic-card').count(), 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (process.env.CHECK_SCREENSHOTS_DIR) await page.screenshot({ path: path.join(process.env.CHECK_SCREENSHOTS_DIR, `new-topics-${viewport.width}.png`), fullPage: true });
      for (const [title, count] of topicCounts) {
        await page.locator('.topic-card').filter({ has: page.getByText(title, { exact: true }) }).click();
        await page.getByRole('heading', { name: title, exact: true }).waitFor();
        assert.equal(await page.locator('.vocabulary-card').count(), count);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.getByRole('link', { name: 'Back to topics' }).click();
        await page.locator('.topic-card').filter({ has: page.getByText(title, { exact: true }) }).waitFor();
      }
      await page.goto(`${base}/test`);
      await page.locator('.loading-screen').waitFor({ state: 'detached' });
      await page.getByPlaceholder('Your name').fill('Content QA');
      await page.getByLabel('Choose test scope').selectOption({ label: 'Transport - Phrasal verbs' });
      await page.getByRole('button', { name: 'Start test' }).click();
      await page.locator('.question-card').last().waitFor();
      assert.equal(await page.locator('.question-card').count(), 6);
      assert.equal(await page.locator('.answer-option').count(), 24);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS ${viewport.width}: all five real topics, 79 words, layout and six-question phrasal verb test`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
