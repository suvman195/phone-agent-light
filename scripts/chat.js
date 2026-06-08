require('../lib/load-env').loadEnvFile();

const target = process.env.AGENT_LIGHT_URL || 'http://127.0.0.1:8787';
const prompt = process.argv.slice(2).join(' ').trim();

if (!prompt) {
  console.error('Usage: npm run chat -- 你好，帮我看看今天的任务');
  process.exit(1);
}

fetch(target + '/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt })
})
  .then(async (response) => {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || ('HTTP ' + response.status));
    }

    console.log(payload.reply);
    if (payload.usage) {
      console.error('usage:', JSON.stringify(payload.usage));
    }
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
