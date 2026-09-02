import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oydhkcghcfxwvyfclwgy.supabase.co";
const SUPABASE_KEY = "sb_publishable_zhGDgWLzFX4_2HMLwgWn9w_nHIKmZuI";
const DB = "test1-workspace";
const DB_VERSION = 2;
const BOUND_USER_KEY = "today-workspace-bound-user";
const SEED_NOTE = "这是一个本地优先的移动工作台。打开即记录，不要求先整理。";
const SEED_TASK = "试着完成一个任务，再新增一条记录";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = selector => document.querySelector(selector);

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll(storeName) {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName).objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getOne(storeName, id) {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName).objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function putOne(storeName, value) {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function deleteOne(storeName, id) {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function isNewer(candidate, existing) {
  if (!existing) return true;
  if (candidate.updatedAt !== existing.updatedAt) return candidate.updatedAt > existing.updatedAt;
  return (candidate.version || 1) > (existing.version || 1);
}

function toRemote(record) {
  return {
    id: record.id,
    text: record.text,
    ...(typeof record.done === "boolean" ? { done: record.done } : {}),
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    version: record.version || 1,
    deleted_at: record.deletedAt || null,
    device_id: record.deviceId || "unknown"
  };
}

function fromRemote(row, userId) {
  return {
    id: row.id,
    text: row.text,
    ...(typeof row.done === "boolean" ? { done: row.done } : {}),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    version: Number(row.version || 1),
    deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
    deviceId: row.device_id,
    userId,
    syncStatus: "synced"
  };
}

function setStatus(message) {
  const element = $("#cloudStatus");
  if (element) element.textContent = message;
}

function ensureAccountUi() {
  if ($("#cloudAccount")) return;
  const settings = $(".settings");
  if (!settings) return;
  const section = document.createElement("div");
  section.className = "setting setting-stack";
  section.id = "cloudAccount";
  section.innerHTML = `
    <span><strong>账号与同步</strong><small id="cloudIdentity">未登录时仍可完全本地使用</small></span>
    <form class="cloud-login" id="cloudLoginForm">
      <input id="cloudEmail" type="email" autocomplete="email" placeholder="邮箱" required />
      <input id="cloudPassword" type="password" autocomplete="current-password" minlength="6" placeholder="密码（至少 6 位）" required />
      <div class="data-actions">
        <button class="btn compact primary" type="submit">登录</button>
        <button class="btn compact" type="button" id="cloudSignupButton">注册</button>
      </div>
    </form>
    <div class="data-actions" id="cloudSignedInActions" hidden>
      <button class="btn compact" type="button" id="cloudSyncButton">立即同步</button>
      <button class="btn compact" type="button" id="cloudLogoutButton">退出登录</button>
    </div>
    <p class="backup-status" id="cloudStatus" aria-live="polite"></p>`;
  settings.prepend(section);

  $("#cloudLoginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const email = $("#cloudEmail").value.trim();
    const password = $("#cloudPassword").value;
    setStatus("正在登录…");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setStatus(error.message);
  });

  $("#cloudSignupButton").addEventListener("click", async () => {
    const email = $("#cloudEmail").value.trim();
    const password = $("#cloudPassword").value;
    if (!email || password.length < 6) {
      setStatus("请输入有效邮箱和至少 6 位密码。");
      return;
    }
    setStatus("正在注册…");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setStatus(error.message);
    else if (!data.session) setStatus("注册成功，请先到邮箱确认账号，再回来登录。");
  });

  $("#cloudSyncButton").addEventListener("click", () => syncNow({ reloadOnChange: true }));
  $("#cloudLogoutButton").addEventListener("click", () => supabase.auth.signOut());
}

function renderSession(session) {
  ensureAccountUi();
  const loggedIn = Boolean(session?.user);
  $("#cloudLoginForm").hidden = loggedIn;
  $("#cloudSignedInActions").hidden = !loggedIn;
  $("#cloudIdentity").textContent = loggedIn ? session.user.email || "已登录" : "未登录时仍可完全本地使用";
  if (!loggedIn) setStatus("");
}

function untouchedSeed(record, text) {
  return record && record.text === text && (record.version || 1) === 1 && !record.deletedAt && record.userId == null && record.syncStatus !== "synced";
}

async function discardUntouchedSeedExamples() {
  const [notes, tasks] = await Promise.all([getAll("notes"), getAll("tasks")]);
  const seeds = [
    ...notes.filter(note => untouchedSeed(note, SEED_NOTE)).map(note => ["notes", note.id]),
    ...tasks.filter(task => untouchedSeed(task, SEED_TASK)).map(task => ["tasks", task.id])
  ];
  for (const [storeName, id] of seeds) {
    await deleteOne(storeName, id);
    await deleteOne("outbox", `${storeName}:${id}`);
  }
}

async function ensureUserBinding(userId) {
  const bound = localStorage.getItem(BOUND_USER_KEY);
  if (!bound) {
    await discardUntouchedSeedExamples();
    localStorage.setItem(BOUND_USER_KEY, userId);
    return true;
  }
  return bound === userId;
}

async function pushOutbox(userId) {
  const entries = await getAll("outbox");
  let pushed = 0;
  for (const entry of entries) {
    const record = entry.record;
    const fn = entry.store === "notes" ? "sync_upsert_note" : "sync_upsert_task";
    const { error } = await supabase.rpc(fn, { payload: toRemote(record) });
    if (error) throw error;
    await deleteOne("outbox", entry.id);
    const current = await getOne(entry.store, entry.entityId);
    if (current && current.updatedAt === record.updatedAt && (current.version || 1) === (record.version || 1)) {
      await putOne(entry.store, { ...current, userId, syncStatus: "synced" });
    }
    pushed += 1;
  }
  return pushed;
}

async function pullStore(storeName, userId) {
  const { data, error } = await supabase.from(storeName).select("*");
  if (error) throw error;
  let changed = 0;
  for (const row of data || []) {
    const incoming = fromRemote(row, userId);
    const current = await getOne(storeName, incoming.id);
    if (isNewer(incoming, current)) {
      await putOne(storeName, incoming);
      changed += 1;
    } else if (current && current.updatedAt === incoming.updatedAt && (current.version || 1) === incoming.version && current.syncStatus !== "synced") {
      await putOne(storeName, { ...current, userId, syncStatus: "synced" });
    }
  }
  return changed;
}

let syncing = false;
async function syncNow({ reloadOnChange = false } = {}) {
  if (syncing || !navigator.onLine) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  if (!await ensureUserBinding(session.user.id)) {
    setStatus("此设备的本地数据已绑定另一个账号，已暂停同步以避免数据混用。");
    return;
  }

  syncing = true;
  setStatus("正在同步…");
  try {
    const pushed = await pushOutbox(session.user.id);
    const [notesChanged, tasksChanged] = await Promise.all([
      pullStore("notes", session.user.id),
      pullStore("tasks", session.user.id)
    ]);
    const changed = notesChanged + tasksChanged;
    setStatus(`同步完成${pushed ? ` · 上传 ${pushed}` : ""}${changed ? ` · 更新 ${changed}` : ""}`);
    if (reloadOnChange && changed) window.location.reload();
  } catch (error) {
    console.error("Cloud sync failed", error);
    setStatus("同步失败，本地数据不受影响；稍后可重试。");
  } finally {
    syncing = false;
  }
}

ensureAccountUi();
const { data: { session } } = await supabase.auth.getSession();
renderSession(session);
if (session?.user) syncNow({ reloadOnChange: true });

supabase.auth.onAuthStateChange((event, nextSession) => {
  renderSession(nextSession);
  if (event === "SIGNED_IN" && nextSession?.user) syncNow({ reloadOnChange: true });
});

window.addEventListener("online", () => syncNow({ reloadOnChange: true }));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") syncNow({ reloadOnChange: true });
});
