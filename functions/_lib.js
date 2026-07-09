// Cloudflare Pages Functions 共享库：D1 建表与辅助函数
// 这里的函数被 functions/api/[[path]].js 调用，不直接作为路由（文件名以 _ 开头会被 Pages 忽略）

/* 首次请求时确保表结构存在（幂等） */
export async function ensureSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      openid TEXT,
      avatar TEXT,
      points INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 0,
      questions TEXT DEFAULT '[]',
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS groups (
      number TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT,
      leader_id TEXT NOT NULL,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS memberships (
      group_number TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      joined_at INTEGER,
      PRIMARY KEY (group_number, user_id)
    );
  `);
}

/* 统一 JSON 响应 */
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

/* 解析 Cookie */
export function parseCookies(req) {
  const h = req.headers.get("Cookie") || "";
  const out = {};
  h.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}

/* 由请求恢复当前登录用户 id（基于 sid cookie） */
export async function getUserId(req, db) {
  const sid = parseCookies(req).sid;
  if (!sid) return null;
  const row = await db.prepare("SELECT user_id FROM sessions WHERE sid=?").bind(sid).first();
  return row ? row.user_id : null;
}

/* 生成会话 token 并写入 sessions 表，返回 Set-Cookie 头值 */
export async function createSession(db, userId) {
  const sid = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
  await db.prepare("INSERT OR REPLACE INTO sessions (sid, user_id, created_at) VALUES (?,?,?)")
    .bind(sid, userId, Date.now()).run();
  return "sid=" + sid + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000";
}

/* 生成 6 位不重复小组编号 */
export async function genGroupNumber(db) {
  for (;;) {
    const n = String(Math.floor(100000 + Math.random() * 900000));
    const row = await db.prepare("SELECT number FROM groups WHERE number=?").bind(n).first();
    if (!row) return n;
  }
}

export async function userName(db, id) {
  const r = await db.prepare("SELECT name FROM users WHERE id=?").bind(id).first();
  return r ? r.name : id;
}

/* 三色 / 科目统计（与前端展示一致） */
export function computeStats(questions) {
  const byMastery = { red: 0, yellow: 0, green: 0 };
  const bySubject = {};
  (questions || []).forEach((q) => {
    const m = q.mastery === 2 ? "green" : q.mastery === 1 ? "yellow" : "red";
    byMastery[m]++;
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
  });
  return { byMastery, bySubject, total: (questions || []).length };
}
