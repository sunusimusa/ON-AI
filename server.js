const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const usersFile = path.join(__dirname, "data", "users.json");

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: "Fill all fields" });
  }

  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }

  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: "User already exists" });
  }

  users.push({ username, password });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  res.json({ success: true });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Wrong login" });
  }

  res.json({ success: true, username });
});

// ===== CHAT (DUMMY AI FOR NOW) =====
app.post("/chat", (req, res) => {
  const { message } = req.body;

  // yanzu fake AI ne
  res.json({
    success: true,
    reply: "Na ji ka: " + message
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
