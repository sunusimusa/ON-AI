import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

/* =====================
   SIMPLE MEMORY STORE
   ===================== */
const users = {}; 
// email: { usedMinutes, proUntil }

/* =====================
   HELPERS
   ===================== */
function now() {
  return Date.now();
}

function isPro(user) {
  return user.proUntil && user.proUntil > now();
}

/* =====================
   HEALTH
   ===================== */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =====================
   AI CHAT
   ===================== */
app.post("/chat", async (req, res) => {
  try {
    const { email, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: "Missing data" });
    }

    // Create user if not exists
    if (!users[email]) {
      users[email] = {
        usedMinutes: 0,
        proUntil: null
      };
    }

    const user = users[email];

    // ⏱️ FREE LIMIT = 8 HOURS (480 minutes)
    if (!isPro(user) && user.usedMinutes >= 480) {
      return res.json({
        locked: true,
        error: "Free limit reached. Upgrade to PRO."
      });
    }

    // AI CALL
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();
    if (!data.choices) {
      console.error(data);
      return res.status(500).json({ error: "AI error" });
    }

    // ⏱️ count 1 minute per message
    if (!isPro(user)) {
      user.usedMinutes += 1;
    }

    res.json({
      reply: data.choices[0].message.content,
      remaining:
        isPro(user) ? "PRO" : `${480 - user.usedMinutes} minutes left`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =====================
   VERIFY PAYMENT (PAYSTACK)
   ===================== */
app.post("/verify-payment", async (req, res) => {
  const { email, reference, days } = req.body;

  if (!email || !reference || !days) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      if (!users[email]) {
        users[email] = { usedMinutes: 0, proUntil: null };
      }

      users[email].proUntil =
        now() + days * 24 * 60 * 60 * 1000;

      return res.json({
        success: true,
        proUntil: users[email].proUntil
      });
    }

    res.json({ success: false });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* =====================
   START
   ===================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
