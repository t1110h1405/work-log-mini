const form = document.getElementById("log-form");
const contentInput = document.getElementById("content");
const manualMinutesInput = document.getElementById("manual-minutes");
const timerDisplay = document.getElementById("timer-display");
const rangeDisplay = document.getElementById("range-display");
const statusEl = document.getElementById("status");
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const resetButton = document.getElementById("reset-button");
const manualToggle = document.getElementById("manual-toggle");
const manualField = document.getElementById("manual-field");
const saveButton = document.getElementById("save-button");

let timerId = null;
let startedAt = null;
let endedAt = null;
let elapsedMs = 0;

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatStamp(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function syncTimer() {
  const activeElapsed = startedAt && !endedAt ? Date.now() - startedAt.getTime() : elapsedMs;
  timerDisplay.textContent = formatDuration(activeElapsed);
}

function syncRange() {
  if (!startedAt) {
    rangeDisplay.textContent = "開始前です";
    return;
  }

  if (!endedAt) {
    rangeDisplay.textContent = `${formatStamp(startedAt)} から計測中`;
    return;
  }

  rangeDisplay.textContent = `${formatStamp(startedAt)} - ${formatStamp(endedAt)}`;
}

function setStatus(message, tone = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

function setButtons() {
  const isRunning = Boolean(timerId);
  startButton.disabled = isRunning;
  stopButton.disabled = !isRunning;
}

function resetTimerState() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  startedAt = null;
  endedAt = null;
  elapsedMs = 0;
  syncTimer();
  syncRange();
  setButtons();
}

function setManualOpen(isOpen) {
  manualField.hidden = !isOpen;
  manualToggle.setAttribute("aria-expanded", String(isOpen));
  manualToggle.classList.toggle("active", isOpen);
}

startButton.addEventListener("click", () => {
  if (timerId) {
    return;
  }

  startedAt = new Date();
  endedAt = null;
  elapsedMs = 0;
  syncTimer();
  syncRange();
  timerId = window.setInterval(syncTimer, 250);
  manualMinutesInput.value = "";
  setButtons();
  setStatus("計測を開始しました。");
});

stopButton.addEventListener("click", () => {
  if (!timerId || !startedAt) {
    return;
  }

  endedAt = new Date();
  elapsedMs = endedAt.getTime() - startedAt.getTime();
  clearInterval(timerId);
  timerId = null;
  syncTimer();
  syncRange();
  setButtons();
  setStatus("停止しました。内容を確認して保存できます。");
});

resetButton.addEventListener("click", () => {
  resetTimerState();
  manualMinutesInput.value = "";
  setManualOpen(false);
  setStatus("入力をリセットしました。");
});

manualToggle.addEventListener("click", () => {
  const nextState = manualField.hidden;
  setManualOpen(nextState);
  if (nextState) {
    manualMinutesInput.focus();
  } else {
    manualMinutesInput.value = "";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const manualMinutes = Number(manualMinutesInput.value);
  const timedMinutes = endedAt && elapsedMs > 0 ? Math.max(1, Math.round(elapsedMs / 60000)) : 0;
  const durationMin = Number.isFinite(manualMinutes) && manualMinutes > 0
    ? Math.round(manualMinutes)
    : timedMinutes;

  if (!contentInput.value.trim()) {
    setStatus("内容を入力してください。", "error");
    contentInput.focus();
    return;
  }

  if (!durationMin || durationMin <= 0) {
    setStatus("タイマーを止めるか、手動入力で分を入れてください。", "error");
    return;
  }

  saveButton.disabled = true;
  setStatus("保存しています...");

  try {
    const response = await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: contentInput.value.trim(),
        date: new Date().toISOString(),
        durationMin,
        startAt: startedAt ? startedAt.toISOString() : null,
        endAt: endedAt ? endedAt.toISOString() : null
      })
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "保存に失敗しました。");
    }

    form.reset();
    resetTimerState();
    setManualOpen(false);
    setStatus("Notion に保存しました。", "success");
    contentInput.focus();
  } catch (error) {
    setStatus(error.message || "保存に失敗しました。", "error");
  } finally {
    saveButton.disabled = false;
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      setStatus("オフライン対応の登録に失敗しました。", "error");
    });
  });
}

syncTimer();
syncRange();
setButtons();
setManualOpen(false);
