import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

/* =======================
   HEALTH CHECK
======================= */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =======================
   AI CHAT
======================= */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message" });
    }

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful AI assistant that understands Hausa." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await aiRes.json();

    if (!data.choices || !data.choices[0]) {
      console.error(data);
      return res.status(500).json({ error: "AI response error" });
    }

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
});

/* =======================
   PAYSTACK VERIFY
======================= */
app.post("/verify-payment", async (req, res) => {
  const { reference, days } = req.body;

  try {
    const payRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = await payRes.json();

    if (data.status && data.data.status === "success") {
      // 👉 anan zaka ajiye PRO expiry (memory / DB)
      return res.json({
        success: true,
        proDays: days
      });
    }

    res.json({ success: false });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* =======================
   PORT (RENDER)
======================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
