const express = require('express');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json());

const config = JSON.parse(fs.readFileSync('/Users/kim/cadam-naver/config.json'));
const BOT_TOKEN = config.telegram.botToken;
const CHAT_ID = config.telegram.chatId;
const DEFAULT_TAGS = config.defaultTags;
const BLOG_ID = config.blogId;

function sendTelegram(msg) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const body = JSON.stringify({ chat_id: CHAT_ID, text: msg });
    execSync(`curl -s -X POST "${url}" -H "Content-Type: application/json" -d '${body.replace(/'/g, "'\\''")}'`);
  } catch(e) {}
}

app.post('/publish', async (req, res) => {
  const title = req.body.title || '제목 없음';
  const content = req.body.content || '내용 없음';
  const tags = req.body.tags || DEFAULT_TAGS;
  const start = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  try {
    const cmd = [
      'cd /Users/kim/cadam-naver',
      `BLOG_TITLE="${title}"`,
      `BLOG_CONTENT="${content}"`,
      `BLOG_TAGS="${tags}"`,
      `BLOG_ID="${BLOG_ID}"`,
      '/opt/homebrew/bin/node post-blog.js 2>&1'
    ].join(' && ');

    const result = execSync(cmd, { timeout: 120000 }).toString();

    if (result.includes('❌') || result.includes('오류')) {
      await sendTelegram(`❌ 블로그 발행 실패!\n\n제목: ${title}\n시간: ${start}\n\n쿠키 만료됐다면 터미널에서 node ~/cadam-naver/save-cookie.js 실행해주세요.`);
      return res.json({ success: false, error: result });
    }

    await sendTelegram(`✅ 네이버 블로그 발행 완료!\n\n제목: ${title}\n시간: ${start}`);
    res.json({ success: true, result });

  } catch (err) {
    const errMsg = err.stdout?.toString() || err.message;
    await sendTelegram(`❌ 블로그 발행 실패!\n\n제목: ${title}\n시간: ${start}\n\n오류: ${errMsg.substring(0, 200)}`);
    res.json({ success: false, error: errMsg });
  }
});

app.post('/refresh-cookie', (req, res) => {
  sendTelegram('🔄 쿠키 갱신 시작!\n\n브라우저가 열릴 거예요. 네이버에 로그인해주세요.');
  exec(
    'cd /Users/kim/cadam-naver && /opt/homebrew/bin/node save-cookie.js',
    { timeout: 180000 },
    (err) => {
      if (err) {
        sendTelegram(`❌ 쿠키 갱신 실패\n${err.message.substring(0, 100)}`);
      } else {
        sendTelegram('✅ 쿠키 갱신 완료!\n앞으로 2~4주간 자동 발행됩니다.');
      }
    }
  );
  res.json({ success: true, message: '갱신 시작됨' });
});

app.listen(3100, '127.0.0.1', () => console.log(`✅ ${config.brand} 발행 서버 실행 중: http://localhost:3100`));
