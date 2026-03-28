const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const cookies = JSON.parse(fs.readFileSync('./naver-cookies.json'));
  const context = await browser.newContext();
  await context.addCookies(cookies);
  const page = await context.newPage();

  await page.goto('https://blog.naver.com/iori21y/postwrite', { waitUntil: 'networkidle', timeout: 30000 });

  try {
    await page.waitForSelector('.se-popup-button-cancel', { timeout: 5000 });
    await page.locator('.se-popup-button-cancel').first().click();
    await page.waitForTimeout(2000);
  } catch {}

  // 발행 패널 열기
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const btn = document.querySelector('[class*="publish_btn__"]');
    if (btn) btn.click();
  });

  await page.waitForTimeout(2500);

  // 태그 관련 요소 찾기
  const result = await page.evaluate(() => {
    const selectors = [
      '[placeholder*="태그"]',
      '[class*="tag"] input',
      '.tag_input',
      '[class*="Tag"] input',
      'input[type="text"]'
    ];
    return selectors.map(sel => {
      const el = document.querySelector(sel);
      return {
        selector: sel,
        found: !!el,
        class: el?.className?.substring(0, 80) || ''
      };
    });
  });

  console.log('\n=== 태그 입력창 검색 결과 ===');
  result.forEach(r => {
    console.log(`${r.found ? '✅' : '❌'} ${r.selector}`);
    if (r.found) console.log(`   클래스: ${r.class}`);
  });

  console.log('\n10초 후 닫힘...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
