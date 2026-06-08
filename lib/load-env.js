const fs = require('fs');
const path = require('path');

function parseEnvLine(line) {
  const match = String(line || '').match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  let value;

  if (!match) {
    return null;
  }

  value = match[2] || '';

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key: match[1], value };
}

function loadEnvFile(filePath) {
  const target = filePath || path.join(__dirname, '..', '.env');
  let content;

  try {
    content = fs.readFileSync(target, 'utf8');
  } catch (error) {
    return false;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    const entry = parseEnvLine(line);

    if (!trimmed || trimmed.startsWith('#') || !entry) {
      continue;
    }

    if (typeof process.env[entry.key] === 'undefined') {
      process.env[entry.key] = entry.value;
    }
  }

  return true;
}

module.exports = { loadEnvFile };
