const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// AI CHAT API
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ success:false });

  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role:"user", content: message }]
    });

    res.json({
      success: true,
      reply: r.choices[0].message.content
    });
  } catch (e) {
    res.json({ success:false, reply:"AI error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
