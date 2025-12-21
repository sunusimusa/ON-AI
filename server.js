const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

/* ================= STORAGE ================= */
const USERS_FILE = path.join(__dirname, "data", "users.json");

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= IMAGE GENERATE ================= */
app.post("/generate", (req, res) => {
  const { email, prompt } = req.body;
  if (!prompt) return res.json({ error: "Prompt required" });

  let users = getUsers();

  // auto-create user (no login stress)
  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      email: email || "guest",
      dailyCount: 0,
      lastUsed: new Date().toISOString().slice(0, 10),
      bonus: 0
    };
    users.push(user);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (user.lastUsed !== today) {
    user.dailyCount = 0;
    user.bonus = 0;
    user.lastUsed = today;
  }

  const LIMIT = 3;
  if (user.dailyCount >= LIMIT + user.bonus) {
    return res.json({
      error: "Daily limit reached. Watch ad to continue."
    });
  }

  user.dailyCount += 1;
  saveUsers(users);

  const imageUrl =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt);

  res.json({
    success: true,
    image: imageUrl,
    remaining: LIMIT + user.bonus - user.dailyCount
  });
});

/* ================= WATCH AD (+1 IMAGE) ================= */
app.post("/watch-ad", (req, res) => {
  const { email } = req.body;
  let users = getUsers();

  let user = users.find(u => u.email === email);
  if (!user) return res.json({ error: "User not found" });

  user.bonus += 1;
  saveUsers(users);

  res.json({
    success: true,
    message: "+1 image added"
  });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
