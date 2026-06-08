const statusTone = document.getElementById('statusTone');
const updatedAt = document.getElementById('updatedAt');
const statusLabel = document.getElementById('statusLabel');
const statusDetail = document.getElementById('statusDetail');
const statusRing = document.getElementById('statusRing');
const tokenValue = document.getElementById('tokenValue');
const tokenFill = document.getElementById('tokenFill');
const routeList = document.getElementById('routeList');
const providerBadge = document.getElementById('providerBadge');
const bindingSelect = document.getElementById('bindingSelect');
const applyBindingButton = document.getElementById('applyBinding');
const bindingHint = document.getElementById('bindingHint');
const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const composerHint = document.getElementById('composerHint');
const sendButton = document.getElementById('sendButton');
const refreshConversationButton = document.getElementById('refreshConversation');
const resetConversationButton = document.getElementById('resetConversation');

const buttons = document.querySelectorAll('[data-command]');

const STATUS_LABELS = {
  IDLE: '待机',
  THINKING: '思考',
  WRITING: '写入',
  RUNNING: '运行',
  DONE: '完成',
  ERROR: '异常',
  NEED_CONFIRM: '确认'
};

let currentConversation = [];
let currentBindingId = 'manual';

function isManualBinding() {
  return currentBindingId === 'manual';
}

function setBindingHint(message, tone) {
  bindingHint.textContent = message;
  bindingHint.classList.remove('is-error', 'is-ok');
  if (tone) {
    bindingHint.classList.add(tone);
  }
}

function formatTime(iso) {
  if (!iso) {
    return '--';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(iso));
}

function roleLabel(role) {
  if (role === 'user') {
    return 'user';
  }
  if (role === 'assistant') {
    return 'assistant';
  }
  return role || 'system';
}

function renderState(state) {
  const meta = state.meta || {};
  const accent = meta.accent || '#5eb0ff';
  const status = String(state.status || 'IDLE').toUpperCase();
  const binding = state.binding || null;

  document.documentElement.style.setProperty('--accent', accent);
  statusTone.textContent = STATUS_LABELS[status] || meta.tone || '待机';
  updatedAt.textContent = formatTime(state.updatedAt);
  statusLabel.textContent = STATUS_LABELS[status] || meta.label || status;
  statusDetail.textContent = state.detail || '等待你的下一步指令。';
  tokenValue.textContent = String(state.tokenPercent) + '%';
  tokenFill.style.width = String(state.tokenPercent) + '%';
  statusRing.style.transform = status === 'THINKING' ? 'rotate(10deg)' : 'none';

  if (status === 'ERROR') {
    statusDetail.classList.add('is-error');
  } else {
    statusDetail.classList.remove('is-error');
  }

  if (binding && binding.id) {
    currentBindingId = binding.id;
  }

  if (binding && binding.label) {
    setBindingHint('当前绑定：' + binding.label + ' · ' + (binding.source || '未知来源'));
  }

  updateInteractionMode();
}

function buildRouteItem(label, url) {
  const item = document.createElement('div');
  item.className = 'route-item';

  const name = document.createElement('div');
  name.className = 'route-label';
  name.textContent = label;

  const link = document.createElement('a');
  link.className = 'route-url';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = url;

  item.appendChild(name);
  item.appendChild(link);
  return item;
}

function renderConfig(config) {
  routeList.innerHTML = '';
  const phoneUrls = Array.isArray(config.phoneUrls) ? config.phoneUrls : [];

  if (!phoneUrls.length) {
    const empty = document.createElement('div');
    empty.className = 'route-item';
    empty.textContent = '没有检测到局域网 IPv4 地址。';
    routeList.appendChild(empty);
  }

  phoneUrls.forEach((baseUrl) => {
    routeList.appendChild(buildRouteItem('控制台', baseUrl + '/'));
    routeList.appendChild(buildRouteItem('普通显示页', baseUrl + '/display.html'));
    routeList.appendChild(buildRouteItem('大字显示页', baseUrl + '/display-focus.html'));
    routeList.appendChild(buildRouteItem('横屏 SVG 页', baseUrl + '/display-landscape.html'));
  });

  providerBadge.textContent = config.ai && config.ai.ready ? 'OpenAI' : 'Mock';
  renderBindingOptions(config.binding || {});
  updateInteractionMode(config.ai || {});
}

function renderBindingOptions(bindingConfig) {
  const options = Array.isArray(bindingConfig.options) ? bindingConfig.options : [];
  const active = bindingConfig.active || null;

  if (active && active.id) {
    currentBindingId = active.id;
  }

  bindingSelect.innerHTML = '';

  options.forEach((option) => {
    const node = document.createElement('option');
    node.value = option.id;
    node.textContent = option.label;
    if (option.id === currentBindingId) {
      node.selected = true;
    }
    bindingSelect.appendChild(node);
  });

  if (active && active.label) {
    setBindingHint('当前绑定：' + active.label + ' · ' + (active.source || '未知来源'));
  } else {
    setBindingHint('没有检测到绑定信息。', 'is-error');
  }

  updateInteractionMode();
}

function renderConversation(messages) {
  currentConversation = messages.slice();
  chatLog.innerHTML = '';

  if (!isManualBinding()) {
    const row = document.createElement('div');
    row.className = 'message-row assistant';

    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = 'binding';

    const body = document.createElement('div');
    body.className = 'message-body';
    body.textContent = '当前手机状态由外部 agent 驱动。这里不再发消息，只展示 Hermes / Codex 的实时工作状态。';

    row.appendChild(role);
    row.appendChild(body);
    chatLog.appendChild(row);
    return;
  }

  if (!currentConversation.length) {
    const row = document.createElement('div');
    row.className = 'message-row assistant';

    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = 'assistant';

    const body = document.createElement('div');
    body.className = 'message-body';
    body.textContent = '会话目前为空。你可以直接发第一条消息。';

    row.appendChild(role);
    row.appendChild(body);
    chatLog.appendChild(row);
    return;
  }

  currentConversation.forEach((message) => {
    const row = document.createElement('div');
    row.className = 'message-row ' + (message.role === 'user' ? 'user' : 'assistant');

    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = roleLabel(message.role);

    const body = document.createElement('div');
    body.className = 'message-body';
    body.textContent = message.content || '';

    row.appendChild(role);
    row.appendChild(body);
    chatLog.appendChild(row);
  });

  chatLog.scrollTop = chatLog.scrollHeight;
}

function setBusy(isBusy) {
  document.body.classList.toggle('is-busy', isBusy);
  sendButton.disabled = isBusy || !isManualBinding();
  chatInput.disabled = isBusy || !isManualBinding();
  resetConversationButton.disabled = isBusy || !isManualBinding();
  applyBindingButton.disabled = isBusy;
  bindingSelect.disabled = isBusy;
  buttons.forEach((button) => {
    button.disabled = isBusy || !isManualBinding();
  });
}

function updateInteractionMode(aiConfig) {
  const manual = isManualBinding();
  chatForm.classList.toggle('is-disabled', !manual);
  document.querySelector('.quick-panel').classList.toggle('is-disabled', !manual);

  if (!manual) {
    composerHint.textContent = '当前绑定的是外部 agent。聊天和手动状态按钮已暂停。';
    composerHint.classList.remove('is-ok');
    composerHint.classList.remove('is-error');
  } else if (aiConfig) {
    composerHint.textContent = aiConfig.ready
      ? '当前已连接 OpenAI，可直接发起真实对话。'
      : '未配置 API Key，当前处于 mock 演示模式。';
    composerHint.classList.remove('is-error');
  }

  sendButton.disabled = !manual;
  chatInput.disabled = !manual;
  resetConversationButton.disabled = !manual;
  buttons.forEach((button) => {
    button.disabled = !manual;
  });
}

async function sendCommand(command) {
  const response = await fetch('/api/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

async function loadState() {
  const response = await fetch('/api/state');
  const payload = await response.json();
  renderState(payload);
}

async function loadConfig() {
  const response = await fetch('/api/config');
  const payload = await response.json();
  renderConfig(payload);
}

async function selectBinding(bindingId) {
  const response = await fetch('/api/bindings/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bindingId })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Binding switch failed');
  }

  renderBindingOptions({
    active: payload.active,
    options: payload.options
  });
  renderState(payload.state);
  renderConversation((payload.conversation && payload.conversation.messages) || []);
}

async function loadConversation() {
  const response = await fetch('/api/conversation');
  const payload = await response.json();
  renderConversation(payload.messages || []);
}

async function sendChat(prompt) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Chat request failed');
  }

  renderState(payload.state);
  renderConversation(payload.conversation.messages || []);
}

async function resetConversation() {
  const response = await fetch('/api/conversation/reset', {
    method: 'POST'
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Reset failed');
  }

  renderState(payload.state);
  renderConversation(payload.conversation.messages || []);
}

buttons.forEach((button) => {
  button.addEventListener('click', async function () {
    setBusy(true);
    try {
      const state = await sendCommand(button.dataset.command);
      renderState(state);
    } catch (error) {
      statusDetail.textContent = error.message;
      statusDetail.classList.add('is-error');
    } finally {
      setBusy(false);
    }
  });
});

chatForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const prompt = chatInput.value.trim();

  if (!prompt) {
    composerHint.textContent = '先写点内容再发送。';
    composerHint.classList.add('is-error');
    return;
  }

  composerHint.classList.remove('is-error');
  setBusy(true);

  const pendingMessages = currentConversation.concat([{ role: 'user', content: prompt }]);
  renderConversation(pendingMessages);
  chatInput.value = '';

  try {
    await sendChat(prompt);
    composerHint.textContent = '消息已处理完成。';
    composerHint.classList.remove('is-error');
    composerHint.classList.add('is-ok');
  } catch (error) {
    composerHint.textContent = error.message;
    composerHint.classList.remove('is-ok');
    composerHint.classList.add('is-error');
    await loadConversation();
    await loadState();
  } finally {
    setBusy(false);
  }
});

refreshConversationButton.addEventListener('click', async function () {
  try {
    await loadConversation();
    await loadState();
  } catch (error) {
    composerHint.textContent = error.message;
    composerHint.classList.add('is-error');
  }
});

resetConversationButton.addEventListener('click', async function () {
  setBusy(true);
  try {
    await resetConversation();
    composerHint.textContent = '会话已清空。';
    composerHint.classList.remove('is-error');
    composerHint.classList.add('is-ok');
  } catch (error) {
    composerHint.textContent = error.message;
    composerHint.classList.remove('is-ok');
    composerHint.classList.add('is-error');
  } finally {
    setBusy(false);
  }
});

applyBindingButton.addEventListener('click', async function () {
  const bindingId = bindingSelect.value;
  if (!bindingId) {
    setBindingHint('请先选择一个绑定目标。', 'is-error');
    return;
  }

  setBusy(true);
  try {
    await selectBinding(bindingId);
    setBindingHint('已切换到新的绑定目标。', 'is-ok');
  } catch (error) {
    setBindingHint(error.message, 'is-error');
  } finally {
    setBusy(false);
  }
});

async function boot() {
  try {
    await loadConfig();
  } catch (error) {
    routeList.innerHTML = '<div class="route-item">设备入口加载失败。</div>';
  }

  try {
    await loadState();
  } catch (error) {
    statusDetail.textContent = '状态加载失败。';
    statusDetail.classList.add('is-error');
  }

  try {
    await loadConversation();
  } catch (error) {
    composerHint.textContent = '会话加载失败。';
    composerHint.classList.add('is-error');
  }
}

boot();

const eventSource = new EventSource('/api/events');
eventSource.onmessage = function (event) {
  renderState(JSON.parse(event.data));
};

eventSource.onerror = function () {
  statusDetail.textContent = '与本地服务的实时连接已断开。';
  statusDetail.classList.add('is-error');
};
