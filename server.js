const express = require("express");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

// ===== OPENAI =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===== FILE =====
const usersFile = path.join(__dirname, "data", "users.json");

// ===== ROUTES (PAGES) =====
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  }

  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: "User already exists" });
  }

  users.push({ username, password, plan: "free" });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  res.json({ success: true });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  }

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Invalid login" });
  }

  res.json({
    success: true,
    username: user.username,
    plan: user.plan
  });
});

// ===== CHAT (AI TEXT) =====
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({ success: false });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({
      success: true,
      reply: response.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// ===== START =====
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
