const connectionNode = document.getElementById('displayConnection');
const modelNode = document.getElementById('displayModel');
const timeNode = document.getElementById('displayTime');
const toneNode = document.getElementById('displayTone');
const statusNode = document.getElementById('displayStatus');
const detailNode = document.getElementById('displayDetail');
const tokenValueNode = document.getElementById('displayTokenValue');
const tokenFillNode = document.getElementById('displayTokenFill');

function formatTime(iso) {
  if (!iso) return '--:--:--';
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(iso));
}

function render(state) {
  connectionNode.textContent = 'LIVE';
  modelNode.textContent = state.runtime?.model || 'MODEL';
  toneNode.textContent = state.meta?.tone?.toUpperCase() || 'READY';
  timeNode.textContent = formatTime(state.updatedAt);
  statusNode.textContent = state.status || 'IDLE';
  detailNode.textContent = state.detail || 'Waiting for your next move.';
  tokenValueNode.textContent = `${state.tokenPercent}%`;
  tokenFillNode.style.width = `${state.tokenPercent}%`;
}

function showOffline() {
  connectionNode.textContent = 'RETRY';
  modelNode.textContent = 'OFFLINE';
  detailNode.textContent = 'Connection lost. Waiting for Mac bridge.';
}

fetch('/api/state')
  .then((response) => response.json())
  .then(render)
  .catch(showOffline);

const eventSource = new EventSource('/api/events');
eventSource.onmessage = (event) => {
  render(JSON.parse(event.data));
};

eventSource.onerror = () => {
  showOffline();
};
