// Cloudflare Pages Functions 捕获所有 /api/* 请求
// 将原本 Express 后端（server.js）原样移植为 Workers 风格 + D1 数据库
import {
  ensureSchema, json, parseCookies, getUserId, createSession, genGroupNumber, userName, computeStats,
} from "../_lib.js";

/* ---------- 鉴权 ---------- */
async function authMe(req, db) {
  const u = await getUserId(req, db);
  if (!u) return json({ user: null });
  const row = await db.prepare("SELECT id, name, openid FROM users WHERE id=?").bind(u).first();
  if (!row) return json({ user: null });
  return json({ user: { id: row.id, name: row.name, wechat: !!row.openid } });
}

async function authDev(req, db) {
  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim() || ("用户" + Math.floor(1000 + Math.random() * 9000));
  // 同名复用，避免重复建号导致丢失小组身份
  let row = await db.prepare("SELECT id, name, openid FROM users WHERE name=?").bind(name).first();
  if (!row) {
    const id = crypto.randomUUID();
    await db.prepare("INSERT INTO users (id, name, points, is_public, questions, created_at) VALUES (?,?,0,0,'[]',?)")
      .bind(id, name, Date.now()).run();
    row = { id, name, openid: null };
  }
  const cookie = await createSession(db, row.id);
  return json({ user: { id: row.id, name: row.name, wechat: !!row.openid } }, 200, { "Set-Cookie": cookie });
}

async function authLogout(req, db) {
  const sid = parseCookies(req).sid;
  if (sid) await db.prepare("DELETE FROM sessions WHERE sid=?").bind(sid).run();
  return json({ ok: true });
}

function wechatNotConfigured() {
  const html = "<!doctype html><html lang='zh'><head><meta charset='utf-8'><title>微信登录未配置</title></head>" +
    "<body style='font-family:sans-serif;padding:40px'>" +
    "<h2>微信登录未配置</h2>" +
    "<p>当前为「体验登录」模式，请返回使用昵称登录即可体验全部功能。</p>" +
    "<p>如需真微信登录，需在 Cloudflare 环境变量配置 WECHAT_APPID / WECHAT_SECRET / PUBLIC_BASE（且需已备案域名）。</p>" +
    "<p><a href='/'>← 返回首页</a></p></body></html>";
  return new Response(html, { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function wechatStart(req, env) {
  if (!env.WECHAT_APPID || !env.WECHAT_SECRET) return wechatNotConfigured();
  const state = crypto.randomUUID().replace(/-/g, "");
  const redirect = encodeURIComponent((env.PUBLIC_BASE || "") + "/api/auth/wechat/callback");
  const url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + env.WECHAT_APPID +
    "&redirect_uri=" + redirect + "&response_type=code&scope=snsapi_userinfo&state=" + state + "#wechat_redirect";
  return new Response(null, { status: 302, headers: { Location: url } });
}

async function wechatCallback(req, db, env) {
  if (!env.WECHAT_APPID || !env.WECHAT_SECRET) return wechatNotConfigured();
  const code = new URL(req.url).searchParams.get("code");
  try {
    const tokRes = await fetch("https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + env.WECHAT_APPID +
      "&secret=" + env.WECHAT_SECRET + "&code=" + code + "&grant_type=authorization_code");
    const tok = await tokRes.json();
    if (tok.errcode) return new Response("微信授权失败: " + tok.errmsg, { status: 400 });
    const infoRes = await fetch("https://api.weixin.qq.com/sns/userinfo?access_token=" + tok.access_token +
      "&openid=" + tok.openid + "&lang=zh_CN");
    const info = await infoRes.json();
    let row = await db.prepare("SELECT id, name, openid FROM users WHERE openid=?").bind(tok.openid).first();
    if (!row) {
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO users (id, name, openid, avatar, points, is_public, questions, created_at) VALUES (?,?,?,?,0,0,'[]',?)")
        .bind(id, info.nickname || "微信用户", tok.openid, info.headimgurl, Date.now()).run();
      row = { id, name: info.nickname || "微信用户", openid: tok.openid };
    }
    const cookie = await createSession(db, row.id);
    return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": cookie } });
  } catch (e) {
    return new Response("微信登录异常: " + e.message, { status: 500 });
  }
}

/* ---------- 个人资料 ---------- */
async function saveProfile(req, db) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const b = await req.json().catch(() => ({}));
  if (typeof b.name === "string" && b.name.trim())
    await db.prepare("UPDATE users SET name=? WHERE id=?").bind(b.name.trim(), u).run();
  if (typeof b.points === "number" && isFinite(b.points))
    await db.prepare("UPDATE users SET points=? WHERE id=?").bind(b.points, u).run();
  if (typeof b.public === "boolean")
    await db.prepare("UPDATE users SET is_public=? WHERE id=?").bind(b.public ? 1 : 0, u).run();
  if (Array.isArray(b.questions))
    await db.prepare("UPDATE users SET questions=? WHERE id=?").bind(JSON.stringify(b.questions), u).run();
  return json({ ok: true });
}

async function getProfile(req, db, id) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const row = await db.prepare("SELECT id, name, points, is_public, questions FROM users WHERE id=?").bind(id).first();
  if (!row) return json({ error: "not found" }, 404);
  const pub = !!row.is_public;
  const questions = pub ? JSON.parse(row.questions || "[]") : [];
  return json({
    id: row.id, name: row.name, points: row.points || 0, public: pub,
    stats: computeStats(questions), questions,
  });
}

/* ---------- 小组 ---------- */
async function createGroup(req, db) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const b = await req.json().catch(() => ({}));
  const name = (b.name || "").trim();
  if (!name) return json({ error: "need name" }, 400);
  const number = await genGroupNumber(db);
  const desc = (b.desc || "").trim();
  await db.prepare("INSERT INTO groups (number, name, desc, leader_id, created_at) VALUES (?,?,?,?,?)")
    .bind(number, name, desc, u, Date.now()).run();
  await db.prepare("INSERT INTO memberships (group_number, user_id, role, joined_at) VALUES (?,?, 'leader', ?)")
    .bind(number, u, Date.now()).run();
  return json({
    group: {
      number, name, desc, leaderId: u, memberCount: 1, createdAt: Date.now(),
      members: [{ id: u, name: await userName(db, u) }], pending: [],
    },
  });
}

async function searchGroup(req, db) {
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q) return json({ group: null });
  const g = await db.prepare("SELECT number, name, desc, leader_id, created_at FROM groups WHERE number=?").bind(q).first();
  if (!g) return json({ group: null });
  const mc = await db.prepare("SELECT COUNT(*) c FROM memberships WHERE group_number=? AND role IN ('leader','member')").bind(q).first();
  return json({ group: { number: g.number, name: g.name, desc: g.desc, leaderId: g.leader_id, memberCount: mc.c, createdAt: g.created_at } });
}

async function myGroups(req, db) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const rows = await db.prepare(
    "SELECT g.number, g.name, g.desc, g.leader_id, m.role FROM memberships m JOIN groups g ON g.number=m.group_number WHERE m.user_id=?"
  ).bind(u).all();
  const list = await Promise.all(rows.results.map(async (r) => {
    const mc = await db.prepare("SELECT COUNT(*) c FROM memberships WHERE group_number=? AND role IN ('leader','member')").bind(r.number).first();
    return { number: r.number, name: r.name, desc: r.desc, role: r.role, memberCount: mc.c };
  }));
  return json({ groups: list });
}

async function getGroup(req, db, num) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const g = await db.prepare("SELECT number, name, desc, leader_id, created_at FROM groups WHERE number=?").bind(num).first();
  if (!g) return json({ error: "not found" }, 404);
  const roleRow = await db.prepare("SELECT role FROM memberships WHERE group_number=? AND user_id=?").bind(num, u).first();
  if (!roleRow) return json({ error: "not member" }, 403);
  const isLeader = g.leader_id === u;
  const isMember = roleRow.role === "leader" || roleRow.role === "member";
  const isPending = roleRow.role === "pending";
  const memberRows = await db.prepare(
    "SELECT u.id, u.name FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.group_number=? AND m.role IN ('leader','member')"
  ).bind(num).all();
  const pending = isLeader
    ? (await db.prepare(
        "SELECT u.id, u.name FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.group_number=? AND m.role='pending'"
      ).bind(num).all()).results
    : [];
  const mc = await db.prepare("SELECT COUNT(*) c FROM memberships WHERE group_number=? AND role IN ('leader','member')").bind(num).first();
  return json({
    group: {
      number: g.number, name: g.name, desc: g.desc, leaderId: g.leader_id, memberCount: mc.c,
      createdAt: g.created_at, isLeader, isMember, isPending, members: memberRows.results, pending,
    },
  });
}

async function joinGroup(req, db, num) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const g = await db.prepare("SELECT number FROM groups WHERE number=?").bind(num).first();
  if (!g) return json({ error: "not found" }, 404);
  const ex = await db.prepare("SELECT role FROM memberships WHERE group_number=? AND user_id=?").bind(num, u).first();
  if (ex && (ex.role === "leader" || ex.role === "member")) return json({ error: "already member" }, 400);
  await db.prepare("INSERT OR REPLACE INTO memberships (group_number, user_id, role, joined_at) VALUES (?,?, 'pending', ?)")
    .bind(num, u, Date.now()).run();
  return json({ ok: true, status: "pending" });
}

async function approveMember(req, db, num) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const g = await db.prepare("SELECT leader_id FROM groups WHERE number=?").bind(num).first();
  if (!g) return json({ error: "not found" }, 404);
  if (g.leader_id !== u) return json({ error: "not leader" }, 403);
  const tid = (await req.json().catch(() => ({}))).userId;
  await db.prepare("UPDATE memberships SET role='member' WHERE group_number=? AND user_id=?").bind(num, tid).run();
  return json({ ok: true });
}

async function rejectMember(req, db, num) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const g = await db.prepare("SELECT leader_id FROM groups WHERE number=?").bind(num).first();
  if (!g) return json({ error: "not found" }, 404);
  if (g.leader_id !== u) return json({ error: "not leader" }, 403);
  const tid = (await req.json().catch(() => ({}))).userId;
  await db.prepare("DELETE FROM memberships WHERE group_number=? AND user_id=?").bind(num, tid).run();
  return json({ ok: true });
}

async function removeMember(req, db, num) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const g = await db.prepare("SELECT leader_id FROM groups WHERE number=?").bind(num).first();
  if (!g) return json({ error: "not found" }, 404);
  if (g.leader_id !== u) return json({ error: "not leader" }, 403);
  const body = await req.json().catch(() => ({}));
  const tid = body.userId || new URL(req.url).searchParams.get("userId");
  if (tid === u) return json({ error: "cannot remove self" }, 400);
  await db.prepare("DELETE FROM memberships WHERE group_number=? AND user_id=?").bind(num, tid).run();
  return json({ ok: true });
}

async function transferLeader(req, db, num) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const g = await db.prepare("SELECT leader_id FROM groups WHERE number=?").bind(num).first();
  if (!g) return json({ error: "not found" }, 404);
  if (g.leader_id !== u) return json({ error: "not leader" }, 403);
  const tid = (await req.json().catch(() => ({}))).userId;
  const trow = await db.prepare("SELECT role FROM memberships WHERE group_number=? AND user_id=?").bind(num, tid).first();
  if (!trow) return json({ error: "not member" }, 400);
  await db.prepare("UPDATE memberships SET role='leader' WHERE group_number=? AND user_id=?").bind(num, tid).run();
  await db.prepare("UPDATE memberships SET role='member' WHERE group_number=? AND user_id=?").bind(num, u).run();
  await db.prepare("UPDATE groups SET leader_id=? WHERE number=?").bind(tid, num).run();
  return json({ ok: true });
}

async function deleteGroup(req, db, num) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const g = await db.prepare("SELECT leader_id FROM groups WHERE number=?").bind(num).first();
  if (!g) return json({ error: "not found" }, 404);
  if (g.leader_id !== u) return json({ error: "not leader" }, 403);
  await db.prepare("DELETE FROM memberships WHERE group_number=?").bind(num).run();
  await db.prepare("DELETE FROM groups WHERE number=?").bind(num).run();
  return json({ ok: true });
}

async function groupMembers(req, db, num) {
  const u = await getUserId(req, db);
  if (!u) return json({ error: "unauthorized" }, 401);
  const g = await db.prepare("SELECT number FROM groups WHERE number=?").bind(num).first();
  if (!g) return json({ error: "not found" }, 404);
  const roleRow = await db.prepare("SELECT role FROM memberships WHERE group_number=? AND user_id=?").bind(num, u).first();
  if (!roleRow || (roleRow.role !== "leader" && roleRow.role !== "member")) return json({ error: "not member" }, 403);
  const rows = await db.prepare(
    "SELECT u.id, u.name, u.points, u.is_public FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.group_number=? AND m.role IN ('leader','member') ORDER BY u.points DESC"
  ).bind(num).all();
  const members = rows.results.map((r) => ({ id: r.id, name: r.name, points: r.points || 0, public: !!r.is_public }));
  return json({ members });
}

/* ---------- 路由分发 ---------- */
async function route(method, seg, req, db, env) {
  const head = seg[0];
  if (head === "auth") {
    if (seg[1] === "me" && method === "GET") return authMe(req, db);
    if (seg[1] === "dev" && method === "POST") return authDev(req, db);
    if (seg[1] === "logout" && method === "POST") return authLogout(req, db);
    if (seg[1] === "wechat" && seg[2] === "start" && method === "GET") return wechatStart(req, env);
    if (seg[1] === "wechat" && seg[2] === "callback" && method === "GET") return wechatCallback(req, db, env);
    return json({ error: "not found" }, 404);
  }
  if (head === "profile") {
    if (!seg[1] && method === "POST") return saveProfile(req, db);
    if (seg[1] && method === "GET") return getProfile(req, db, seg[1]);
    return json({ error: "not found" }, 404);
  }
  if (head === "groups") {
    if (!seg[1] && method === "POST") return createGroup(req, db);
    if (seg[1] === "mine" && method === "GET") return myGroups(req, db);
    if (seg[1] === "search" && method === "GET") return searchGroup(req, db);
    const num = seg[1];
    if (!num) return json({ error: "not found" }, 404);
    if (seg[2] === "join" && method === "POST") return joinGroup(req, db, num);
    if (seg[2] === "approve" && method === "POST") return approveMember(req, db, num);
    if (seg[2] === "reject" && method === "POST") return rejectMember(req, db, num);
    if (seg[2] === "transfer" && method === "POST") return transferLeader(req, db, num);
    if (seg[2] === "members" && method === "GET") return groupMembers(req, db, num);
    if (seg[2] === "member" && method === "DELETE") return removeMember(req, db, num);
    if (!seg[2] && method === "GET") return getGroup(req, db, num);
    if (!seg[2] && method === "DELETE") return deleteGroup(req, db, num);
    return json({ error: "not found" }, 404);
  }
  return json({ error: "not found" }, 404);
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  if (!db) return json({ error: "D1_NOT_BOUND", message: "未绑定 D1 数据库，请在 Cloudflare 控制台为 Pages 项目绑定 D1。" }, 500);
  await ensureSchema(db);
  const method = request.method;
  const seg = (context.params.path || "").split("/").filter(Boolean);
  try {
    return await route(method, seg, request, db, env);
  } catch (e) {
    return json({ error: "server_error", message: e.message }, 500);
  }
}
