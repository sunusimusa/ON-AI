const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

/* ===== OPENAI ===== */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===== MIDDLEWARE ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ===== FILE PATH ===== */
const usersFile = path.join(__dirname, "data", "users.json");

/* ===== HELPERS ===== */
function readUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

/* ===== ROUTES ===== */

// Home → login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

/* ===== REGISTER ===== */
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  const users = readUsers();
  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.json({ success: false, message: "User already exists" });
  }

  users.push({
    username,
    email,
    password,
    plan: "free"
  });

  saveUsers(users);
  res.json({ success: true });
});

/* ===== LOGIN ===== */
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find(
    u =>
      (u.username === username || u.email === username) &&
      u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Invalid login" });
  }

  res.json({
    success: true,
    user: {
      username: user.username,
      plan: user.plan
    }
  });
});

/* ===== CHAT AI ===== */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ success: false });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "AI error" });
  }
});

/* ===== START ===== */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
