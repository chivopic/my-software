const DB = "test1-workspace"; // Legacy key intentionally kept so existing installs retain data.
const VER = 1;
const BACKUP_FORMAT = "today-workspace-backup";
const BACKUP_VERSION = 1;

let view = "today";
let filter = "open";
let editing = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

function db() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, VER);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("notes")) database.createObjectStore("notes", { keyPath: "id" });
      if (!database.objectStoreNames.contains("tasks")) database.createObjectStore("tasks", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function all(name) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const request = database.transaction(name).objectStore(name).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function put(name, value) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(name, "readwrite");
    transaction.objectStore(name).put(value);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function del(name, id) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(name, "readwrite");
    transaction.objectStore(name).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

const icons = () => window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
const fmt = time => new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(time));
const empty = text => `<div class="empty">${text}</div>`;

function taskRow(task) {
  const element = document.createElement("div");
  element.className = `row task ${task.done ? "done" : ""}`;
  element.innerHTML = `<button class="check" aria-label="${task.done ? "标记未完成" : "完成任务"}"><i data-lucide="check"></i></button><div class="main"><p class="title"></p><div class="meta">${fmt(task.createdAt)}</div></div><div class="actions"><button class="icon trash" aria-label="删除任务" title="删除"><i data-lucide="trash-2"></i></button></div>`;
  $(".title", element).textContent = task.text;
  $(".check", element).onclick = async () => {
    task.done = !task.done;
    task.updatedAt = Date.now();
    await put("tasks", task);
    render();
  };
  $(".trash", element).onclick = async () => {
    await del("tasks", task.id);
    render();
  };
  return element;
}

function noteRow(note) {
  const element = document.createElement("div");
  element.className = "row note";
  element.innerHTML = `<div class="main"><p class="title"></p><div class="meta">${fmt(note.updatedAt)}</div></div><div class="actions"><button class="icon trash" aria-label="删除记录" title="删除"><i data-lucide="trash-2"></i></button></div>`;
  const summary = note.text.replace(/\s+/g, " ").trim();
  $(".title", element).textContent = summary.length > 120 ? `${summary.slice(0, 120)}…` : summary;
  element.onclick = event => {
    if (!event.target.closest(".trash")) openEditor(note);
  };
  $(".trash", element).onclick = async () => {
    await del("notes", note.id);
    render();
  };
  return element;
}

async function renderToday() {
  const [tasks, notes] = await Promise.all([all("tasks"), all("notes")]);
  const taskContainer = $("#todayTasks");
  const noteContainer = $("#todayNotes");
  taskContainer.innerHTML = "";
  noteContainer.innerHTML = "";
  const openTasks = tasks.filter(task => !task.done).sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  const recentNotes = notes.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  taskContainer.className = openTasks.length ? "list" : "";
  noteContainer.className = recentNotes.length ? "list" : "";
  if (!openTasks.length) taskContainer.innerHTML = empty("当前没有待完成任务");
  else openTasks.forEach(task => taskContainer.append(taskRow(task)));
  if (!recentNotes.length) noteContainer.innerHTML = empty("还没有记录");
  else recentNotes.forEach(note => noteContainer.append(noteRow(note)));
}

async function renderTasks() {
  let tasks = await all("tasks");
  tasks.sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
  if (filter === "open") tasks = tasks.filter(task => !task.done);
  if (filter === "done") tasks = tasks.filter(task => task.done);
  const container = $("#tasksList");
  container.innerHTML = "";
  container.className = tasks.length ? "list" : "";
  if (!tasks.length) container.innerHTML = empty(filter === "done" ? "暂无已完成任务" : filter === "open" ? "当前没有待完成任务" : "还没有任务");
  else tasks.forEach(task => container.append(taskRow(task)));
}

async function renderNotes() {
  const query = $("#notesSearch").value.trim().toLowerCase();
  let notes = await all("notes");
  notes.sort((a, b) => b.updatedAt - a.updatedAt);
  if (query) notes = notes.filter(note => note.text.toLowerCase().includes(query));
  const container = $("#notesList");
  container.innerHTML = "";
  container.className = notes.length ? "list" : "";
  if (!notes.length) container.innerHTML = empty(query ? "没有匹配的记录" : "还没有记录");
  else notes.forEach(note => container.append(noteRow(note)));
}

async function render() {
  await Promise.all([renderToday(), renderTasks(), renderNotes()]);
  icons();
}

function nav(nextView) {
  view = nextView;
  $$(".view").forEach(element => element.classList.toggle("active", element.dataset.view === nextView));
  $$(".nav").forEach(element => element.classList.toggle("active", element.dataset.nav === nextView));
  $("#pageTitle").textContent = { today: "今天", notes: "记录", tasks: "任务" }[nextView];
  icons();
}

function openEditor(note = null) {
  editing = note?.id || null;
  $("#editorTitle").textContent = note ? "编辑记录" : "新建记录";
  $("#editorText").value = note?.text || "";
  $("#editorDialog").showModal();
  setTimeout(() => $("#editorText").focus(), 50);
}

async function seed() {
  const [notes, tasks] = await Promise.all([all("notes"), all("tasks")]);
  if (notes.length || tasks.length) return;
  const now = Date.now();
  await put("notes", { id: uid(), text: "这是一个本地优先的移动工作台。打开即记录，不要求先整理。", createdAt: now - 3600000, updatedAt: now - 3600000 });
  await put("tasks", { id: uid(), text: "试着完成一个任务，再新增一条记录", done: false, createdAt: now - 1800000, updatedAt: now - 1800000 });
}

function theme() {
  const saved = localStorage.getItem("test1-theme");
  const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("#themeToggle").checked = dark;
}

function setBackupStatus(message) {
  $("#backupStatus").textContent = message;
}

function backupFilename() {
  return `today-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

async function exportBackup() {
  try {
    const [notes, tasks] = await Promise.all([all("notes"), all("tasks")]);
    const payload = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), notes, tasks };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFilename();
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupStatus(`已导出 ${notes.length} 条记录、${tasks.length} 个任务。`);
  } catch (error) {
    console.error(error);
    setBackupStatus("导出失败，请重试。");
  }
}

const validTime = value => Number.isFinite(value) && value > 0;
const validId = value => typeof value === "string" && value.length > 0 && value.length <= 200;
const validNote = note => note && validId(note.id) && typeof note.text === "string" && note.text.length <= 20000 && validTime(note.createdAt) && validTime(note.updatedAt);
const validTask = task => task && validId(task.id) && typeof task.text === "string" && task.text.length <= 5000 && typeof task.done === "boolean" && validTime(task.createdAt) && validTime(task.updatedAt);

function normalizeNewest(records) {
  const map = new Map();
  records.forEach(record => {
    const existing = map.get(record.id);
    if (!existing || record.updatedAt > existing.updatedAt) map.set(record.id, record);
  });
  return [...map.values()];
}

async function mergeBackup(importedNotes, importedTasks) {
  const [currentNotes, currentTasks] = await Promise.all([all("notes"), all("tasks")]);
  const noteMap = new Map(currentNotes.map(note => [note.id, note]));
  const taskMap = new Map(currentTasks.map(task => [task.id, task]));
  const notesToWrite = normalizeNewest(importedNotes).filter(note => !noteMap.has(note.id) || note.updatedAt > noteMap.get(note.id).updatedAt);
  const tasksToWrite = normalizeNewest(importedTasks).filter(task => !taskMap.has(task.id) || task.updatedAt > taskMap.get(task.id).updatedAt);
  if (!notesToWrite.length && !tasksToWrite.length) return { notes: 0, tasks: 0 };

  const database = await db();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(["notes", "tasks"], "readwrite");
    const noteStore = transaction.objectStore("notes");
    const taskStore = transaction.objectStore("tasks");
    notesToWrite.forEach(note => noteStore.put(note));
    tasksToWrite.forEach(task => taskStore.put(task));
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("Import aborted"));
  });
  return { notes: notesToWrite.length, tasks: tasksToWrite.length };
}

async function importBackup(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    setBackupStatus("备份文件过大，未导入。");
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    if (payload?.format !== BACKUP_FORMAT || payload?.version !== BACKUP_VERSION || !Array.isArray(payload.notes) || !Array.isArray(payload.tasks) || !payload.notes.every(validNote) || !payload.tasks.every(validTask)) throw new Error("Invalid backup format");
    const merged = await mergeBackup(payload.notes, payload.tasks);
    await render();
    setBackupStatus(merged.notes || merged.tasks ? `已合并 ${merged.notes} 条记录、${merged.tasks} 个任务；较新的本地内容会保留。` : "没有需要更新的数据；当前内容已经更新或相同。");
  } catch (error) {
    console.error(error);
    setBackupStatus("无法识别这个备份文件，未修改现有数据。");
  } finally {
    $("#importFile").value = "";
  }
}

$$('[data-nav]').forEach(button => { button.onclick = () => nav(button.dataset.nav); });

$("#captureForm").onsubmit = async event => {
  event.preventDefault();
  const input = $("#captureInput");
  const raw = input.value.trim();
  if (!raw) return;
  const isTask = /^\/task(\s|$)/i.test(raw);
  const text = raw.replace(/^\/task\s*/i, "").trim();
  if (!text) return;
  const now = Date.now();
  if (isTask) await put("tasks", { id: uid(), text, done: false, createdAt: now, updatedAt: now });
  else await put("notes", { id: uid(), text, createdAt: now, updatedAt: now });
  input.value = "";
  render();
};

$("#taskForm").onsubmit = async event => {
  event.preventDefault();
  const input = $("#taskInput");
  const text = input.value.trim();
  if (!text) return;
  const now = Date.now();
  await put("tasks", { id: uid(), text, done: false, createdAt: now, updatedAt: now });
  input.value = "";
  render();
};

$$(".chip").forEach(chip => {
  chip.onclick = () => {
    filter = chip.dataset.filter;
    $$(".chip").forEach(element => element.classList.toggle("active", element === chip));
    renderTasks().then(icons);
  };
});

$("#notesSearch").oninput = renderNotes;
$("#newNoteButton").onclick = () => openEditor();
$("#settingsButton").onclick = () => $("#settingsDialog").showModal();

$("#editorForm").onsubmit = async event => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const text = $("#editorText").value.trim();
  if (!text) return;
  const old = editing ? (await all("notes")).find(note => note.id === editing) : null;
  const now = Date.now();
  await put("notes", { id: editing || uid(), text, createdAt: old?.createdAt || now, updatedAt: now });
  $("#editorDialog").close();
  editing = null;
  render();
};

$("#themeToggle").onchange = event => {
  const nextTheme = event.target.checked ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("test1-theme", nextTheme);
};

$("#exportButton").onclick = exportBackup;
$("#importButton").onclick = () => $("#importFile").click();
$("#importFile").onchange = event => importBackup(event.target.files?.[0]);

$("#dateLabel").textContent = new Intl.DateTimeFormat("zh-CN", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

theme();
icons();
seed().then(render);
nav(view);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.warn);
