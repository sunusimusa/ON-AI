const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Chat API
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({ reply: "Message is empty" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({ reply: "AI error, try again later" });
  }
});

app.listen(PORT, () => {
  console.log("✅ Tele Tech AI Text Bot running on port " + PORT);
});
