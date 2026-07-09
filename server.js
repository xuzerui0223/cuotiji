/**
 * 错题本 + 学习小组 后端服务
 * - 托管静态文件（index.html / app.js / styles.css）
 * - 用户身份（微信 OAuth 框架 + 体验登录回退）
 * - 学习小组（创建/按编号搜索/申请/审批/移除/转移/删除/排行）
 * - 个人资料共享（积分 / 公开开关 / 错题快照，按隐私返回）
 *
 * 运行：node server.js  然后浏览器打开 http://localhost:3000
 * 微信真登录需在环境变量配置 WECHAT_APPID / WECHAT_SECRET / PUBLIC_BASE
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "server_data.json");
const SESSION_SECRET = process.env.SESSION_SECRET || ("cb-" + crypto.randomBytes(8).toString("hex"));
const WECHAT_APPID = process.env.WECHAT_APPID || "";
const WECHAT_SECRET = process.env.WECHAT_SECRET || "";
const PUBLIC_BASE = process.env.PUBLIC_BASE || ("http://localhost:" + PORT);

/* ---------------- 数据存储（JSON 文件，原子写） ---------------- */
let db = { users: {}, sessions: {}, groups: {} };
function load() {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch (e) { db = { users: {}, sessions: {}, groups: {} }; }
}
function save() {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
load();

function uid() { return crypto.randomBytes(8).toString("hex"); }
function genGroupNumber() {
  let n;
  do { n = String(Math.floor(100000 + Math.random() * 900000)); } while (db.groups[n]);
  return n;
}

/* ---------------- 会话 ---------------- */
function getUserId(req) {
  const m = (req.headers.cookie || "").match(/sid=([\w-]+)/);
  if (!m) return null;
  return db.sessions[m[1]] || null;
}
function setSession(res, userId) {
  const token = crypto.randomBytes(24).toString("hex");
  db.sessions[token] = userId;
  save();
  res.setHeader("Set-Cookie", "sid=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000");
}
function requireUser(req, res) {
  const u = getUserId(req);
  if (!u || !db.users[u]) { res.status(401).json({ error: "unauthorized" }); return null; }
  return u;
}

/* ---------------- 统计 ---------------- */
function computeStats(questions) {
  const byMastery = { red: 0, yellow: 0, green: 0 };
  const bySubject = {};
  (questions || []).forEach((q) => {
    const m = q.mastery === 2 ? "green" : q.mastery === 1 ? "yellow" : "red";
    byMastery[m]++;
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
  });
  return { byMastery, bySubject, total: (questions || []).length };
}

/* ---------------- 应用 ---------------- */
const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.static(ROOT));

/* ---------------- 鉴权 ---------------- */
app.get("/api/auth/me", (req, res) => {
  const u = getUserId(req);
  if (!u || !db.users[u]) return res.json({ user: null });
  const user = db.users[u];
  res.json({ user: { id: user.id, name: user.name, wechat: !!user.openid } });
});

app.post("/api/auth/dev", (req, res) => {
  const name = (req.body.name || "").trim() || ("用户" + Math.floor(1000 + Math.random() * 9000));
  const id = uid();
  db.users[id] = { id, name, createdAt: Date.now() };
  setSession(res, id);
  save();
  res.json({ user: { id, name, wechat: false } });
});

app.post("/api/auth/logout", (req, res) => {
  const m = (req.headers.cookie || "").match(/sid=([\w-]+)/);
  if (m) { delete db.sessions[m[1]]; save(); }
  res.json({ ok: true });
});

// 微信 OAuth 开始（需配置 AppID/Secret）
app.get("/api/auth/wechat/start", (req, res) => {
  if (!WECHAT_APPID || !WECHAT_SECRET) {
    return res.status(400).json({ error: "wechat_not_configured", message: "未配置微信 AppID/Secret，请使用体验登录，或在环境变量中配置后启用真微信登录。" });
  }
  const state = crypto.randomBytes(8).toString("hex");
  const redirect = encodeURIComponent(PUBLIC_BASE + "/api/auth/wechat/callback");
  const url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + WECHAT_APPID +
    "&redirect_uri=" + redirect + "&response_type=code&scope=snsapi_userinfo&state=" + state + "#wechat_redirect";
  res.redirect(url);
});

// 微信 OAuth 回调（需配置 AppID/Secret + 已备案域名）
app.get("/api/auth/wechat/callback", async (req, res) => {
  const code = req.query.code;
  if (!WECHAT_APPID || !WECHAT_SECRET) return res.status(400).send("微信未配置");
  try {
    const tokRes = await fetch("https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + WECHAT_APPID +
      "&secret=" + WECHAT_SECRET + "&code=" + code + "&grant_type=authorization_code");
    const tok = await tokRes.json();
    if (tok.errcode) return res.status(400).send("微信授权失败: " + tok.errmsg);
    const infoRes = await fetch("https://api.weixin.qq.com/sns/userinfo?access_token=" + tok.access_token +
      "&openid=" + tok.openid + "&lang=zh_CN");
    const info = await infoRes.json();
    let user = Object.values(db.users).find((u) => u.openid === tok.openid);
    if (!user) {
      user = { id: uid(), openid: tok.openid, name: info.nickname || "微信用户", avatar: info.headimgurl, createdAt: Date.now() };
      db.users[user.id] = user;
    }
    setSession(res, user.id);
    save();
    res.redirect("/");
  } catch (e) {
    res.status(500).send("微信登录异常: " + e.message);
  }
});

/* ---------------- 个人资料共享 ---------------- */
app.post("/api/profile", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const b = req.body || {};
  const user = db.users[u];
  user.profile = user.profile || {};
  if (typeof b.name === "string" && b.name.trim()) user.name = b.name.trim();
  if (typeof b.points === "number" && isFinite(b.points)) user.profile.points = b.points;
  if (typeof b.public === "boolean") user.profile.public = b.public;
  if (Array.isArray(b.questions)) user.profile.questions = b.questions;
  save();
  res.json({ ok: true });
});

app.get("/api/profile/:id", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const user = db.users[req.params.id];
  if (!user) return res.status(404).json({ error: "not found" });
  const prof = user.profile || {};
  const pub = prof.public || false;
  res.json({
    id: user.id,
    name: user.name,
    points: prof.points || 0,
    public: pub,
    stats: computeStats(pub ? prof.questions : []),
    questions: pub ? (prof.questions || []) : [],
  });
});

/* ---------------- 小组 ---------------- */
function publicGroup(g) {
  return {
    number: g.number, name: g.name, desc: g.desc,
    leaderId: g.leaderId, memberCount: g.members.length, createdAt: g.createdAt,
  };
}

app.post("/api/groups", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "need name" });
  const number = genGroupNumber();
  db.groups[number] = {
    number, name, desc: (req.body.desc || "").trim(),
    leaderId: u, members: [u], pending: [], createdAt: Date.now(),
  };
  save();
  res.json({ group: db.groups[number] });
});

app.get("/api/groups/search", (req, res) => {
  const q = (req.query.q || "").trim();
  const g = q ? db.groups[q] : null;
  if (!g) return res.json({ group: null });
  res.json({ group: publicGroup(g) });
});

app.get("/api/groups/mine", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const list = Object.values(db.groups)
    .filter((g) => g.members.includes(u) || g.pending.includes(u))
    .map((g) => ({
      number: g.number, name: g.name, desc: g.desc,
      role: g.leaderId === u ? "leader" : g.members.includes(u) ? "member" : "pending",
      memberCount: g.members.length,
    }));
  res.json({ groups: list });
});

app.get("/api/groups/:num", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const g = db.groups[req.params.num];
  if (!g) return res.status(404).json({ error: "not found" });
  const isMember = g.members.includes(u);
  const isLeader = g.leaderId === u;
  const isPending = g.pending.includes(u);
  if (!isMember && !isPending) return res.status(403).json({ error: "not member" });
  const members = g.members.map((id) => ({ id, name: db.users[id] ? db.users[id].name : id }));
  const pending = isLeader ? g.pending.map((id) => ({ id, name: db.users[id] ? db.users[id].name : id })) : [];
  res.json({ group: Object.assign(publicGroup(g), { isLeader, isMember, isPending, members, pending }) });
});

app.post("/api/groups/:num/join", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const g = db.groups[req.params.num];
  if (!g) return res.status(404).json({ error: "not found" });
  if (g.members.includes(u)) return res.status(400).json({ error: "already member" });
  if (!g.pending.includes(u)) { g.pending.push(u); save(); }
  res.json({ ok: true, status: "pending" });
});

app.post("/api/groups/:num/approve", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const g = db.groups[req.params.num];
  if (!g) return res.status(404).json({ error: "not found" });
  if (g.leaderId !== u) return res.status(403).json({ error: "not leader" });
  const tid = req.body.userId;
  g.pending = g.pending.filter((x) => x !== tid);
  if (!g.members.includes(tid)) g.members.push(tid);
  save();
  res.json({ ok: true });
});

app.post("/api/groups/:num/reject", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const g = db.groups[req.params.num];
  if (!g) return res.status(404).json({ error: "not found" });
  if (g.leaderId !== u) return res.status(403).json({ error: "not leader" });
  g.pending = g.pending.filter((x) => x !== req.body.userId);
  save();
  res.json({ ok: true });
});

app.delete("/api/groups/:num/member", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const g = db.groups[req.params.num];
  if (!g) return res.status(404).json({ error: "not found" });
  if (g.leaderId !== u) return res.status(403).json({ error: "not leader" });
  const tid = req.body.userId;
  if (tid === u) return res.status(400).json({ error: "cannot remove self" });
  g.members = g.members.filter((x) => x !== tid);
  g.pending = g.pending.filter((x) => x !== tid);
  save();
  res.json({ ok: true });
});

app.post("/api/groups/:num/transfer", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const g = db.groups[req.params.num];
  if (!g) return res.status(404).json({ error: "not found" });
  if (g.leaderId !== u) return res.status(403).json({ error: "not leader" });
  const tid = req.body.userId;
  if (!g.members.includes(tid)) return res.status(400).json({ error: "not member" });
  g.leaderId = tid;
  save();
  res.json({ ok: true });
});

app.delete("/api/groups/:num", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const g = db.groups[req.params.num];
  if (!g) return res.status(404).json({ error: "not found" });
  if (g.leaderId !== u) return res.status(403).json({ error: "not leader" });
  delete db.groups[req.params.num];
  save();
  res.json({ ok: true });
});

app.get("/api/groups/:num/members", (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const g = db.groups[req.params.num];
  if (!g) return res.status(404).json({ error: "not found" });
  if (!g.members.includes(u) && g.leaderId !== u) return res.status(403).json({ error: "not member" });
  const arr = g.members.map((id) => {
    const p = db.users[id] || {};
    return { id, name: p.name || id, points: (p.profile && p.profile.points) || 0, public: (p.profile && p.profile.public) || false };
  }).sort((a, b) => b.points - a.points);
  res.json({ members: arr });
});

app.listen(PORT, () => {
  console.log("错题本 + 学习小组 服务已启动: http://localhost:" + PORT);
  if (!WECHAT_APPID) console.log("提示: 未配置微信 AppID，已启用「体验登录」。配置 WECHAT_APPID/WECHAT_SECRET/PUBLIC_BASE 后启用真微信登录。");
});
