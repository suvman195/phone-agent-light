require('../lib/load-env').loadEnvFile();

const target = process.env.AGENT_LIGHT_URL || 'http://127.0.0.1:8787';
const command = process.argv[2];

if (!command) {
  console.error('Usage: npm run send -- THINKING');
  process.exit(1);
}

fetch(`${target}/api/command`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command })
})
  .then(async (response) => {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `HTTP ${response.status}`);
    }
    console.log(text);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
