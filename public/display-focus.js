var connectionNode = document.getElementById('displayConnection');
var modelNode = document.getElementById('displayModel');
var timeNode = document.getElementById('displayTime');
var toneNode = document.getElementById('displayTone');
var statusNode = document.getElementById('displayStatus');
var tokenValueNode = document.getElementById('displayTokenValue');
var tokenFillNode = document.getElementById('displayTokenFill');
var shellNode = document.getElementById('focusShell');

var params = new URLSearchParams(window.location.search);
var layoutMode = params.get('layout');
var isLandscapeRight = layoutMode === 'landscape-right';

if (isLandscapeRight) {
  document.body.classList.add('mode-landscape-right');
  if (shellNode) {
    shellNode.setAttribute('data-layout', 'landscape-right');
  }
}

const TONE_LABELS = {
  READY: '待机',
  REASONING: '思考',
  EDITING: '写入',
  TOOLING: '运行',
  COMPLETE: '完成',
  ATTENTION: '异常',
  'AWAITING INPUT': '等待'
};

const STATUS_LABELS = {
  IDLE: '待机',
  THINKING: '思考',
  WRITING: '写入',
  RUNNING: '运行',
  DONE: '完成',
  ERROR: '异常',
  NEED_CONFIRM: '确认'
};

function formatTime(iso) {
  if (!iso) return '--:--';
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
}

function fitText(node, minSize, maxSize) {
  const box = node.parentElement;
  if (!box) return;

  const widthLimit = box.clientWidth * 0.96;
  const heightLimit = box.clientHeight * 0.96;
  let low = minSize;
  let high = maxSize;
  let best = minSize;

  while (low <= high) {
    const size = Math.floor((low + high) / 2);
    node.style.fontSize = size + 'px';

    if (node.scrollWidth <= widthLimit && node.scrollHeight <= heightLimit) {
      best = size;
      low = size + 1;
    } else {
      high = size - 1;
    }
  }

  node.style.fontSize = best + 'px';
}

function layoutText() {
  if (isLandscapeRight) {
    fitText(toneNode, 42, 150);
    fitText(statusNode, 72, 260);
    return;
  }

  fitText(toneNode, 42, 180);
  fitText(statusNode, 72, 320);
}

function render(state) {
  var meta = state && state.meta ? state.meta : null;
  var tone = String((meta && meta.tone) || 'READY').toUpperCase();
  var status = String(state.status || 'IDLE').toUpperCase();

  connectionNode.textContent = 'LIVE';
  modelNode.textContent = (state.runtime && state.runtime.model) ? state.runtime.model : 'MODEL';
  timeNode.textContent = formatTime(state.updatedAt);
  toneNode.textContent = TONE_LABELS[tone] || tone;
  statusNode.textContent = STATUS_LABELS[status] || status;
  tokenValueNode.textContent = state.tokenPercent + '%';
  tokenFillNode.style.width = state.tokenPercent + '%';

  requestAnimationFrame(layoutText);
}

function showOffline() {
  connectionNode.textContent = 'RETRY';
  modelNode.textContent = 'OFFLINE';
}

window.addEventListener('resize', function () {
  requestAnimationFrame(layoutText);
});

fetch('/api/state')
  .then(function (response) {
    return response.json();
  })
  .then(render)
  .catch(showOffline);

var eventSource = new EventSource('/api/events');
eventSource.onmessage = function (event) {
  render(JSON.parse(event.data));
};

eventSource.onerror = showOffline;
