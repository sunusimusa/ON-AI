const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

/* ===== MIDDLEWARE ===== */
app.use(express.json());
app.use(express.static("public"));

/* ===== CHAT TEST ENDPOINT ===== */
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "Ba ka rubuta sako ba" });
  }

  return res.json({
    reply: "Na ji ka 👍"
  });
});

/* ===== ROUTES ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

/* ===== START SERVER ===== */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
