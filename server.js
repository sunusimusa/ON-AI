const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 10000;

/* ===== FILE ===== */
const USERS_FILE = path.join(__dirname, "data", "users.json");
function canGenerate(user) {
  const today = new Date().toISOString().slice(0, 10);

  // idan sabuwar rana ce
  if (user.lastUsed !== today) {
    user.lastUsed = today;
    user.dailyCount = 0;
  }

  // free limit
  if (user.plan === "free" && user.dailyCount >= 5) {
    return false;
  }

  return true;
}

/* ===== HELPERS ===== */
function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ===== MIDDLEWARE ===== */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===== ROUTES ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===== REGISTER ===== */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, error: "Missing fields" });
  }

  const users = getUsers();

  if (users.find(u => u.email === email)) {
    return res.json({ success: false, error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hashedPassword,
    plan: "free"
  });

  saveUsers(users);

  res.json({ success: true });
});

/* ===== LOGIN ===== */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, error: "Email da password suna da muhimmanci" });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.json({ success: false, error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.json({ success: false, error: "Wrong password" });
    }

    res.json({
      success: true,
      email: user.email,
      plan: user.plan || "free"
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
function canGenerate(user) {
  const today = new Date().toISOString().slice(0, 10);

  if (user.lastUsed !== today) {
    user.lastUsed = today;
    user.dailyCount = 0;
  }

  if (user.plan === "free" && user.dailyCount >= 5) {
    return false;
  }

  return true;
}

app.post("/generate", (req, res) => {
  const { email } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!canGenerate(user)) {
    return res.status(403).json({
      error: "Daily free limit reached. Upgrade to Pro."
    });
  }

  user.dailyCount += 1;
  saveUsers(users);

  res.json({
    success: true,
    message: "Image generated",
    remaining:
      user.plan === "free" ? 5 - user.dailyCount : "unlimited"
  });
});

/* ===== START ===== */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
