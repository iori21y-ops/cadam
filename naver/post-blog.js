const { chromium } = require('playwright');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('/Users/kim/cadam-naver/config.json'));
const title = process.env.BLOG_TITLE || '테스트 제목';
const content = process.env.BLOG_CONTENT || '테스트 내용입니다.';
const tags = process.env.BLOG_TAGS || config.defaultTags;
const blogId = process.env.BLOG_ID || config.blogId;

const logFile = '/Users/kim/cadam-naver/publish.log';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

(async () => {
  try {
    log('🔄 블로그 발행 시작: ' + title);

    const browser = await chromium.launch({ headless: true });
    const cookies = JSON.parse(fs.readFileSync('/Users/kim/cadam-naver/naver-cookies.json'));
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();

    await page.goto(`https://blog.naver.com/${blogId}/postwrite`, { waitUntil: 'networkidle', timeout: 30000 });

    if (page.url().includes('nidlogin')) {
      log('❌ 로그인 세션 만료');
      process.exit(1);
    }

    log('✅ 로그인 확인됨');

    // 임시저장 팝업 처리
    try {
      await page.waitForSelector('.se-popup-button-cancel', { timeout: 5000 });
      log('📋 임시저장 팝업 → 취소');
      await page.locator('.se-popup-button-cancel').first().click();
      await page.waitForTimeout(2000);
    } catch {
      log('📋 임시저장 팝업 없음');
    }

    // 도움말 닫기
    try {
      await page.waitForSelector('.se-help-panel-close-button', { timeout: 3000 });
      await page.click('.se-help-panel-close-button');
      await page.waitForTimeout(1000);
    } catch {}

    await page.waitForTimeout(2000);

    // 제목 입력
    log('📝 제목 입력 중...');
    const titleCoords = await page.evaluate(() => {
      const el = document.querySelector('.se-documentTitle');
      const box = el?.getBoundingClientRect();
      return box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : null;
    });

    if (titleCoords) {
      await page.mouse.click(titleCoords.x, titleCoords.y);
      await page.waitForTimeout(800);
      await page.keyboard.type(title, { delay: 50 });
      log('✅ 제목 입력 완료');
    }

    await page.waitForTimeout(1000);

    // 본문 입력
    log('📝 본문 입력 중...');
    if (titleCoords) {
      await page.mouse.click(titleCoords.x, titleCoords.y + 250);
      await page.waitForTimeout(800);
      await page.keyboard.type(content, { delay: 50 });
      log('✅ 본문 입력 완료');
    }

    await page.waitForTimeout(1500);

    // 발행 패널 열기
    log('🚀 발행 패널 열기...');
    await page.evaluate(() => {
      const btn = document.querySelector('[class*="publish_btn__"]');
      if (btn) btn.click();
    });

    await page.waitForTimeout(2500);

    // 태그 입력
    log('🏷️ 태그 입력 중...');
    try {
      const tagInput = page.locator('[placeholder*="태그"]').first();
      if (await tagInput.isVisible()) {
        await tagInput.click();
        await page.waitForTimeout(500);
        const tagList = tags.split(',');
        for (const tag of tagList) {
          await tagInput.type(tag.trim(), { delay: 30 });
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
        }
        log('✅ 태그 입력 완료');
      } else {
        log('⚠️ 태그 입력창 안 보임');
      }
    } catch(e) {
      log('⚠️ 태그 입력 실패: ' + e.message);
    }

    await page.waitForTimeout(1000);

    // 최종 발행 버튼
    log('🚀 최종 발행 클릭...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b =>
        b.innerText.trim() === '발행' &&
        !b.className.includes('publish_btn__') &&
        !b.className.includes('reserve')
      );
      if (btn) btn.click();
    });

    await page.waitForTimeout(4000);
    log('✅ 발행 완료! URL: ' + page.url());

    await browser.close();
    process.exit(0);

  } catch (err) {
    const msg = '❌ 오류: ' + err.message;
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    console.error(msg);
    process.exit(1);
  }
})();
