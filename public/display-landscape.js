var svgNode = document.getElementById('focusSvg');
var connectionNode = document.getElementById('displayConnection');
var modelNode = document.getElementById('displayModel');
var batteryValueNode = document.getElementById('displayBatteryValue');
var batteryMetaNode = document.getElementById('displayBatteryMeta');
var batteryFillNode = document.getElementById('displayBatteryFill');
var batteryBoltNode = document.getElementById('displayBatteryBolt');
var timeNode = document.getElementById('displayTime');
var elapsedHoursNode = document.getElementById('displayElapsedHours');
var elapsedMinutesNode = document.getElementById('displayElapsedMinutes');
var elapsedSecondsNode = document.getElementById('displayElapsedSeconds');
var toneNode = document.getElementById('displayTone');
var statusNode = document.getElementById('displayStatus');
var detailNode = document.getElementById('displayDetail');
var cpuChartNode = document.getElementById('displayCpuChart');
var cpuValueNode = document.getElementById('displayCpuValue');
var cpuSubNode = document.getElementById('displayCpuSub');
var memoryChartNode = document.getElementById('displayMemoryChart');
var memoryValueNode = document.getElementById('displayMemoryValue');
var memorySubNode = document.getElementById('displayMemorySub');
var tokenValueNode = document.getElementById('displayTokenValue');
var tokenFillNode = document.getElementById('displayTokenFill');

var glyphOuterRingNode = document.getElementById('glyphOuterRing');
var glyphInnerRingNode = document.getElementById('glyphInnerRing');
var glyphIdlePulseNode = document.getElementById('glyphIdlePulse');
var glyphCenterNode = document.getElementById('glyphCenter');
var glyphOrbitDotsNode = document.getElementById('glyphOrbitDots');
var glyphDot1Node = document.getElementById('glyphDot1');
var glyphDot2Node = document.getElementById('glyphDot2');
var glyphDot3Node = document.getElementById('glyphDot3');
var glyphDot4Node = document.getElementById('glyphDot4');
var glyphWritingGroupNode = document.getElementById('glyphWritingGroup');
var glyphWriteLine1Node = document.getElementById('glyphWriteLine1');
var glyphWriteLine2Node = document.getElementById('glyphWriteLine2');
var glyphWriteLine3Node = document.getElementById('glyphWriteLine3');
var glyphWriteCursorNode = document.getElementById('glyphWriteCursor');
var glyphRunGroupNode = document.getElementById('glyphRunGroup');
var glyphCheckNode = document.getElementById('glyphCheck');
var glyphErrorGroupNode = document.getElementById('glyphErrorGroup');
var glyphErrorLineNode = document.getElementById('glyphErrorLine');
var glyphErrorDotNode = document.getElementById('glyphErrorDot');
var glyphConfirmGroupNode = document.getElementById('glyphConfirmGroup');
var glyphQuestionNode = document.getElementById('glyphQuestion');
var glyphQuestionDotNode = document.getElementById('glyphQuestionDot');

var TOKEN_BAR_X = 64;
var TOKEN_BAR_WIDTH = 1152;
var TOKEN_BAR_Y = 696;
var TOKEN_FILL_INSET = 4;
var TOKEN_FILL_HEIGHT = 18;
var POLL_INTERVAL_MS = 3000;
var CHART_WIDTH = 220;
var CHART_HEIGHT = 54;
var BATTERY_FILL_MAX_WIDTH = 64;
var BATTERY_FILL_MIN_WIDTH = 8;

var TONE_LABELS = {
  READY: 'Ready',
  REASONING: 'Thinking',
  EDITING: 'Writing',
  TOOLING: 'Running',
  COMPLETE: 'Complete',
  ATTENTION: 'Error',
  'AWAITING INPUT': 'Pending'
};

var STATUS_LABELS = {
  IDLE: '待机',
  THINKING: '思考中',
  WRITING: '编辑中',
  RUNNING: '运行中',
  DONE: '已完成',
  ERROR: '异常',
  NEED_CONFIRM: '待确认'
};

var currentState = {
  status: 'IDLE',
  tokenPercent: 100,
  updatedAt: null,
  meta: { tone: 'READY' },
  task: null
};

var connectionState = {
  online: false,
  blinkOn: true,
  lastSuccessAt: 0
};

var animationState = {
  frame: 0,
  status: 'IDLE'
};

var batteryState = {
  supported: false,
  level: null,
  charging: false,
  chargingTime: null,
  dischargingTime: null,
  manager: null
};

function pad2(value) {
  value = String(value);
  if (value.length < 2) {
    return '0' + value;
  }
  return value;
}

function formatClockNow() {
  var date = new Date();
  return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
}

function setNodeText(node, value) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  node.appendChild(document.createTextNode(value));
}

function trimText(value, maxChars) {
  var text = String(value || '').trim();

  if (!text) {
    return '';
  }

  if (text.length <= maxChars) {
    return text;
  }

  if (maxChars <= 3) {
    return text.slice(0, maxChars);
  }

  return text.slice(0, maxChars - 3) + '...';
}

function setVisible(node, visible) {
  node.setAttribute('display', visible ? 'inline' : 'none');
}

function setOpacity(node, value) {
  node.setAttribute('opacity', String(value));
}

function syncViewportSize() {
  var width = window.innerWidth || document.documentElement.clientWidth || 720;
  var height = window.innerHeight || document.documentElement.clientHeight || 1280;

  svgNode.style.width = width + 'px';
  svgNode.style.height = height + 'px';
  document.body.style.width = width + 'px';
  document.body.style.height = height + 'px';
}

function nudgeFullscreen() {
  syncViewportSize();
  window.setTimeout(function () {
    try {
      window.scrollTo(0, 1);
    } catch (error) {
      return;
    }
  }, 80);
}

function fitSvgText(node, options) {
  var minSize = options.minSize;
  var maxSize = options.maxSize;
  var maxWidth = options.maxWidth;
  var maxHeight = options.maxHeight;
  var size = maxSize;
  var box;

  while (size >= minSize) {
    node.setAttribute('font-size', String(size));

    try {
      box = node.getBBox();
    } catch (error) {
      return;
    }

    if (box.width <= maxWidth && box.height <= maxHeight) {
      return;
    }

    size = size - 4;
  }

  node.setAttribute('font-size', String(minSize));
}

function layoutText() {
  fitSvgText(modelNode, {
    minSize: 18,
    maxSize: 28,
    maxWidth: 420,
    maxHeight: 36
  });

  fitSvgText(batteryValueNode, {
    minSize: 20,
    maxSize: 30,
    maxWidth: 120,
    maxHeight: 34
  });

  fitSvgText(batteryMetaNode, {
    minSize: 12,
    maxSize: 16,
    maxWidth: 120,
    maxHeight: 18
  });

  fitSvgText(elapsedHoursNode, {
    minSize: 34,
    maxSize: 54,
    maxWidth: 140,
    maxHeight: 58
  });

  fitSvgText(elapsedMinutesNode, {
    minSize: 34,
    maxSize: 54,
    maxWidth: 140,
    maxHeight: 58
  });

  fitSvgText(elapsedSecondsNode, {
    minSize: 34,
    maxSize: 54,
    maxWidth: 140,
    maxHeight: 58
  });

  fitSvgText(toneNode, {
    minSize: 76,
    maxSize: 116,
    maxWidth: 620,
    maxHeight: 136
  });

  fitSvgText(statusNode, {
    minSize: 112,
    maxSize: 244,
    maxWidth: 680,
    maxHeight: 230
  });

  fitSvgText(detailNode, {
    minSize: 28,
    maxSize: 42,
    maxWidth: 700,
    maxHeight: 54
  });

  fitSvgText(cpuValueNode, {
    minSize: 38,
    maxSize: 56,
    maxWidth: 244,
    maxHeight: 64
  });

  fitSvgText(memoryValueNode, {
    minSize: 30,
    maxSize: 56,
    maxWidth: 360,
    maxHeight: 64
  });
}

function clampPercent(value) {
  if (!isFinite(value)) {
    return 100;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return value;
}

function formatPercent(value) {
  var numeric = Number(value);

  if (!isFinite(numeric)) {
    return '--';
  }

  return Math.round(numeric) + '%';
}

function formatGigabytes(bytes) {
  var numeric = Number(bytes);

  if (!isFinite(numeric) || numeric <= 0) {
    return '0 GB';
  }

  if (numeric >= 100 * 1024 * 1024 * 1024) {
    return Math.round(numeric / (1024 * 1024 * 1024)) + ' GB';
  }

  return (numeric / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function formatBatteryDuration(seconds) {
  var numeric = Number(seconds);
  var hours;

  if (!isFinite(numeric) || numeric <= 0) {
    return '';
  }

  hours = numeric / 3600;

  if (hours >= 10) {
    return Math.round(hours) + 'H';
  }

  return hours.toFixed(1) + 'H';
}

function formatElapsedUnit(value, suffix) {
  var numeric = Number(value);

  if (!isFinite(numeric) || numeric < 0) {
    numeric = 0;
  }

  return pad2(Math.floor(numeric)) + suffix;
}

function getElapsedSeconds() {
  var task = currentState && currentState.task ? currentState.task : null;
  var startMs;
  var endMs;

  if (!task || !task.startedAt) {
    return 0;
  }

  startMs = new Date(task.startedAt).getTime();

  if (!isFinite(startMs)) {
    return Number(task.elapsedSec) || 0;
  }

  if (task.active === false) {
    if (isFinite(Number(task.elapsedSec))) {
      return Math.max(0, Number(task.elapsedSec));
    }

    if (task.endedAt) {
      endMs = new Date(task.endedAt).getTime();
      if (isFinite(endMs) && endMs >= startMs) {
        return Math.max(0, Math.round((endMs - startMs) / 1000));
      }
    }
  }

  return Math.max(0, Math.round((Date.now() - startMs) / 1000));
}

function renderElapsed() {
  var elapsedSeconds = getElapsedSeconds();
  var hours = Math.floor(elapsedSeconds / 3600);
  var minutes = Math.floor((elapsedSeconds % 3600) / 60);
  var seconds = elapsedSeconds % 60;

  if (!elapsedHoursNode || !elapsedMinutesNode || !elapsedSecondsNode) {
    return;
  }

  setNodeText(elapsedHoursNode, formatElapsedUnit(hours, 'H'));
  setNodeText(elapsedMinutesNode, formatElapsedUnit(minutes, 'M'));
  setNodeText(elapsedSecondsNode, formatElapsedUnit(seconds, 'S'));
}

function buildSparklinePath(values, startX, baseY, width, height) {
  var points = Array.isArray(values) ? values : [];
  var commands = [];
  var step;
  var index;
  var x;
  var y;
  var value;

  if (!points.length) {
    return '';
  }

  if (points.length === 1) {
    y = baseY - (clampPercent(points[0]) / 100) * height;
    return 'M ' + startX + ' ' + y + ' L ' + (startX + width) + ' ' + y;
  }

  step = width / (points.length - 1);

  for (index = 0; index < points.length; index += 1) {
    value = clampPercent(points[index]);
    x = startX + step * index;
    y = baseY - (value / 100) * height;
    commands.push((index === 0 ? 'M ' : 'L ') + x.toFixed(1) + ' ' + y.toFixed(1));
  }

  return commands.join(' ');
}

function renderConnection() {
  if (connectionState.online) {
    setNodeText(connectionNode, 'LIVE');
    connectionNode.setAttribute('fill', connectionState.blinkOn ? '#111111' : '#8a8a8a');
    return;
  }

  setNodeText(connectionNode, 'OFF');
  connectionNode.setAttribute('fill', '#8a8a8a');
}

function renderClock() {
  setNodeText(timeNode, formatClockNow());
}

function syncBatteryStateFromManager() {
  var manager = batteryState.manager;

  if (!manager) {
    return;
  }

  batteryState.supported = true;
  batteryState.level = Number(manager.level);
  batteryState.charging = Boolean(manager.charging);
  batteryState.chargingTime = Number(manager.chargingTime);
  batteryState.dischargingTime = Number(manager.dischargingTime);
  renderState();
}

function renderBattery() {
  var level = Number(batteryState.level);
  var percent = clampPercent(level * 100);
  var fillWidth = BATTERY_FILL_MIN_WIDTH;
  var fillColor = '#181818';
  var metaLabel = 'BATTERY';
  var durationLabel = '';

  if (!batteryValueNode || !batteryMetaNode || !batteryFillNode || !batteryBoltNode) {
    return;
  }

  if (!batteryState.supported || !isFinite(level)) {
    setNodeText(batteryValueNode, '--');
    setNodeText(batteryMetaNode, 'UNAVAILABLE');
    batteryFillNode.setAttribute('width', String(BATTERY_FILL_MIN_WIDTH));
    batteryFillNode.setAttribute('fill', '#b4b4b4');
    setVisible(batteryBoltNode, false);
    return;
  }

  fillWidth = Math.round(BATTERY_FILL_MIN_WIDTH + (BATTERY_FILL_MAX_WIDTH - BATTERY_FILL_MIN_WIDTH) * percent / 100);

  if (percent <= 20) {
    fillColor = '#b42318';
  } else if (percent <= 40) {
    fillColor = '#b26a00';
  }

  if (batteryState.charging) {
    metaLabel = 'CHARGING';
    durationLabel = formatBatteryDuration(batteryState.chargingTime);
  } else {
    durationLabel = formatBatteryDuration(batteryState.dischargingTime);
  }

  if (durationLabel) {
    metaLabel += ' ' + durationLabel;
  }

  setNodeText(batteryValueNode, Math.round(percent) + '%');
  setNodeText(batteryMetaNode, metaLabel);
  batteryFillNode.setAttribute('width', String(fillWidth));
  batteryFillNode.setAttribute('fill', fillColor);
  setVisible(batteryBoltNode, batteryState.charging);
}

function bindBatteryManager(manager) {
  var eventNames = ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'];
  var index;

  batteryState.manager = manager;
  syncBatteryStateFromManager();

  for (index = 0; index < eventNames.length; index += 1) {
    manager.addEventListener(eventNames[index], syncBatteryStateFromManager);
  }
}

function setupBatteryMonitoring() {
  if (!navigator || typeof navigator.getBattery !== 'function') {
    renderBattery();
    return;
  }

  navigator.getBattery().then(function (manager) {
    bindBatteryManager(manager);
  }).catch(function () {
    renderBattery();
  });
}

function resetGlyphVisibility() {
  setVisible(glyphIdlePulseNode, false);
  setVisible(glyphCenterNode, true);
  setVisible(glyphOrbitDotsNode, false);
  setVisible(glyphWritingGroupNode, false);
  setVisible(glyphRunGroupNode, false);
  setVisible(glyphCheckNode, false);
  setVisible(glyphErrorGroupNode, false);
  setVisible(glyphConfirmGroupNode, false);

  glyphOuterRingNode.setAttribute('stroke-width', '6');
  glyphInnerRingNode.setAttribute('stroke-width', '4');
  glyphOuterRingNode.setAttribute('stroke', '#181818');
  glyphInnerRingNode.setAttribute('stroke', '#7c7c7c');
  glyphOuterRingNode.setAttribute('transform', 'rotate(0)');
  glyphInnerRingNode.setAttribute('transform', 'rotate(0)');
  glyphOrbitDotsNode.setAttribute('transform', 'rotate(0)');
  glyphRunGroupNode.setAttribute('transform', 'rotate(0)');
  glyphCheckNode.setAttribute('transform', 'scale(1)');
  glyphErrorGroupNode.setAttribute('transform', 'scale(1)');
  glyphConfirmGroupNode.setAttribute('transform', 'scale(1)');

  setOpacity(glyphOuterRingNode, 1);
  setOpacity(glyphInnerRingNode, 1);
  setOpacity(glyphIdlePulseNode, 1);
  setOpacity(glyphCenterNode, 1);
  setOpacity(glyphOrbitDotsNode, 1);
  setOpacity(glyphDot1Node, 1);
  setOpacity(glyphDot2Node, 1);
  setOpacity(glyphDot3Node, 1);
  setOpacity(glyphDot4Node, 1);
  setOpacity(glyphWritingGroupNode, 1);
  setOpacity(glyphWriteLine1Node, 1);
  setOpacity(glyphWriteLine2Node, 1);
  setOpacity(glyphWriteLine3Node, 1);
  setOpacity(glyphWriteCursorNode, 1);
  setOpacity(glyphRunGroupNode, 1);
  setOpacity(glyphCheckNode, 1);
  setOpacity(glyphErrorGroupNode, 1);
  setOpacity(glyphErrorLineNode, 1);
  setOpacity(glyphErrorDotNode, 1);
  setOpacity(glyphConfirmGroupNode, 1);
  setOpacity(glyphQuestionNode, 1);
  setOpacity(glyphQuestionDotNode, 1);

  glyphIdlePulseNode.setAttribute('r', '30');
  glyphCenterNode.setAttribute('r', '12');
  glyphWriteCursorNode.setAttribute('x', '46');
  glyphWriteLine1Node.setAttribute('x2', '50');
  glyphWriteLine2Node.setAttribute('x2', '62');
  glyphWriteLine3Node.setAttribute('x2', '34');
}

function renderGlyph() {
  var status = String(currentState && currentState.status ? currentState.status : 'IDLE').toUpperCase();
  var frame = animationState.frame;
  var dotPhase;
  var idlePulse;

  animationState.status = status;
  resetGlyphVisibility();

  if (status === 'THINKING') {
    setVisible(glyphOrbitDotsNode, true);
    glyphOrbitDotsNode.setAttribute('transform', 'rotate(' + String(frame * 9) + ')');
    dotPhase = frame % 4;
    setOpacity(glyphDot1Node, dotPhase === 0 ? 1 : 0.28);
    setOpacity(glyphDot2Node, dotPhase === 1 ? 1 : 0.28);
    setOpacity(glyphDot3Node, dotPhase === 2 ? 1 : 0.28);
    setOpacity(glyphDot4Node, dotPhase === 3 ? 1 : 0.28);
    glyphInnerRingNode.setAttribute('stroke-width', frame % 2 === 0 ? '6' : '4');
    return;
  }

  if (status === 'WRITING') {
    setVisible(glyphWritingGroupNode, true);
    glyphWriteCursorNode.setAttribute('x', String(22 + (frame % 6) * 8));
    setOpacity(glyphWriteCursorNode, frame % 2 === 0 ? 1 : 0.18);
    glyphWriteLine1Node.setAttribute('x2', String(24 + (frame % 5) * 8));
    glyphWriteLine2Node.setAttribute('x2', String(44 + (frame % 4) * 6));
    glyphWriteLine3Node.setAttribute('x2', String(6 + (frame % 6) * 7));
    glyphInnerRingNode.setAttribute('stroke', '#181818');
    return;
  }

  if (status === 'RUNNING') {
    setVisible(glyphRunGroupNode, true);
    glyphRunGroupNode.setAttribute('transform', 'rotate(' + String(frame * 12) + ')');
    glyphOuterRingNode.setAttribute('stroke-width', frame % 2 === 0 ? '8' : '5');
    return;
  }

  if (status === 'DONE') {
    setVisible(glyphCheckNode, true);
    glyphCheckNode.setAttribute('transform', frame % 4 === 0 ? 'scale(1.05)' : 'scale(1)');
    setOpacity(glyphCheckNode, frame % 4 === 0 ? 0.72 : 1);
    glyphOuterRingNode.setAttribute('stroke-width', '8');
    return;
  }

  if (status === 'ERROR') {
    setVisible(glyphErrorGroupNode, true);
    setOpacity(glyphErrorLineNode, frame % 2 === 0 ? 1 : 0.28);
    setOpacity(glyphErrorDotNode, frame % 2 === 0 ? 1 : 0.28);
    glyphOuterRingNode.setAttribute('stroke-width', '8');
    glyphInnerRingNode.setAttribute('stroke', '#181818');
    return;
  }

  if (status === 'NEED_CONFIRM') {
    setVisible(glyphConfirmGroupNode, true);
    glyphConfirmGroupNode.setAttribute('transform', frame % 4 === 0 ? 'scale(1.06)' : 'scale(1)');
    setOpacity(glyphQuestionDotNode, frame % 3 === 0 ? 1 : 0.38);
    return;
  }

  idlePulse = 30 + (frame % 5) * 5;
  setVisible(glyphIdlePulseNode, true);
  glyphIdlePulseNode.setAttribute('r', String(idlePulse));
  setOpacity(glyphIdlePulseNode, 0.22 + (frame % 4) * 0.12);
  glyphInnerRingNode.setAttribute('stroke-width', frame % 2 === 0 ? '4' : '5');
}

function renderState() {
  var meta = currentState && currentState.meta ? currentState.meta : null;
  var system = currentState && currentState.system ? currentState.system : null;
  var tone = 'READY';
  var status = 'IDLE';
  var detail = '';
  var tokenPercent = 100;
  var cpuPercent = system ? Number(system.cpuPercent) : NaN;
  var memoryPercent = system ? Number(system.memoryPercent) : NaN;
  var memoryUsedBytes = system ? Number(system.memoryUsedBytes) : NaN;
  var memoryTotalBytes = system ? Number(system.memoryTotalBytes) : NaN;

  if (meta && meta.tone) {
    tone = String(meta.tone).toUpperCase();
  }

  if (currentState && currentState.status) {
    status = String(currentState.status).toUpperCase();
  }

  if (currentState && currentState.detail) {
    detail = trimText(currentState.detail, 20);
  }

  if (currentState && typeof currentState.tokenPercent !== 'undefined') {
    tokenPercent = Number(currentState.tokenPercent);
  }

  tokenPercent = clampPercent(tokenPercent);

  setNodeText(toneNode, TONE_LABELS[tone] || tone);
  setNodeText(modelNode, currentState && currentState.runtime && currentState.runtime.model ? currentState.runtime.model : 'MODEL');
  renderBattery();
  renderElapsed();
  setNodeText(statusNode, STATUS_LABELS[status] || status);
  setNodeText(detailNode, detail || 'Waiting for your next...');
  setNodeText(cpuValueNode, formatPercent(cpuPercent));
  setNodeText(cpuSubNode, '实时占用');
  setNodeText(memoryValueNode, formatGigabytes(memoryUsedBytes));
  setNodeText(memorySubNode, formatPercent(memoryPercent) + ' · 总 ' + formatGigabytes(memoryTotalBytes));
  cpuChartNode.setAttribute('d', buildSparklinePath(system && system.cpuHistory, 352, 600, CHART_WIDTH, CHART_HEIGHT));
  memoryChartNode.setAttribute('d', buildSparklinePath(system && system.memoryHistory, 956, 600, CHART_WIDTH, CHART_HEIGHT));
  setNodeText(tokenValueNode, Math.round(tokenPercent) + '%');
  tokenFillNode.setAttribute('x', String(TOKEN_BAR_X + TOKEN_FILL_INSET));
  tokenFillNode.setAttribute('y', String(TOKEN_BAR_Y + TOKEN_FILL_INSET));
  tokenFillNode.setAttribute('height', String(TOKEN_FILL_HEIGHT));
  tokenFillNode.setAttribute('width', String(Math.round((TOKEN_BAR_WIDTH - TOKEN_FILL_INSET * 2) * tokenPercent / 100)));
  layoutText();
}

function renderAll() {
  renderConnection();
  renderClock();
  renderState();
  renderGlyph();
}

function markOnline() {
  connectionState.online = true;
  connectionState.lastSuccessAt = Date.now();
}

function markOffline() {
  connectionState.online = false;
  renderConnection();
}

function requestState() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/state?_ts=' + new Date().getTime(), true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) {
      return;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        currentState = JSON.parse(xhr.responseText);
        markOnline();
        renderAll();
      } catch (error) {
        markOffline();
      }
      return;
    }

    markOffline();
  };
  xhr.onerror = markOffline;
  xhr.send(null);
}

function tickConnection() {
  if (connectionState.online && Date.now() - connectionState.lastSuccessAt > POLL_INTERVAL_MS * 2 + 500) {
    connectionState.online = false;
  }

  connectionState.blinkOn = !connectionState.blinkOn;
  renderConnection();
}

function tickAnimation() {
  animationState.frame += 1;
  renderGlyph();
  renderState();
}

if (svgNode && svgNode.createSVGRect) {
  renderAll();
}

window.onresize = function () {
  syncViewportSize();
  layoutText();
};

syncViewportSize();
nudgeFullscreen();
layoutText();
setupBatteryMonitoring();
requestState();
window.setInterval(requestState, POLL_INTERVAL_MS);
window.setInterval(function () {
  renderClock();
  renderState();
}, 1000);
window.setInterval(tickConnection, 700);
window.setInterval(tickAnimation, 160);
window.setTimeout(nudgeFullscreen, 300);
window.setTimeout(nudgeFullscreen, 900);
