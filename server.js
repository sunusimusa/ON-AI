const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

/* ================= STORAGE ================= */
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");

function getUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= PAGES ================= */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ================= IMAGE GENERATE ================= */
app.post("/generate", (req, res) => {
  const { prompt, email = "guest" } = req.body;
  if (!prompt) return res.json({ error: "Prompt required" });

  const today = new Date().toISOString().slice(0, 10);
  let users = getUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      email,
      plan: "free",
      dailyCount: 0,
      lastUsed: today
    };
    users.push(user);
  }

  if (user.lastUsed !== today) {
    user.dailyCount = 0;
    user.lastUsed = today;
  }

  if (user.plan === "free" && user.dailyCount >= 3) {
    return res.json({
      error: "Free limit reached. Watch ad or upgrade to PRO."
    });
  }

  const imageUrl =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt);

  user.dailyCount += 1;
  saveUsers(users);

  res.json({
    image: imageUrl,
    remaining:
      user.plan === "free" ? 3 - user.dailyCount : "unlimited"
  });
});

/* ================= WATCH AD ================= */
app.post("/watch-ad", (req, res) => {
  const { email = "guest" } = req.body;
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) return res.json({ error: "User not found" });

  user.dailyCount = Math.max(user.dailyCount - 1, 0);
  saveUsers(users);

  res.json({ success: true, message: "+1 image added" });
});

/* ================= PAY BEFORE DOWNLOAD ================= */
app.post("/unlock-pro", (req, res) => {
  const { email = "guest" } = req.body;
  const users = getUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      email,
      plan: "pro",
      dailyCount: 0,
      lastUsed: new Date().toISOString().slice(0, 10)
    };
    users.push(user);
  } else {
    user.plan = "pro";
  }

  saveUsers(users);
  res.json({ success: true, plan: "pro" });
});

/* ================= ADMIN STATS ================= */
app.get("/admin/stats", (req, res) => {
  const users = getUsers();
  res.json({
    users: users.length,
    pro: users.filter(u => u.plan === "pro").length
  });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
