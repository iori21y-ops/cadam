const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://nid.naver.com/nidlogin.login');
  
  console.log('✅ 브라우저가 열렸습니다. 네이버에 직접 로그인하세요.');
  console.log('⏳ 로그인 후 기다리는 중...');
  
  await page.waitForURL('https://www.naver.com/**', { timeout: 120000 });
  
  const cookies = await context.cookies();
  fs.writeFileSync('./naver-cookies.json', JSON.stringify(cookies, null, 2));
  
  console.log('✅ 쿠키 저장 완료! naver-cookies.json 파일 생성됨');
  await browser.close();
})();
