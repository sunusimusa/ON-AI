import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const FREE_HOURS = 8;
const users = {}; // simple memory store

// ✅ Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// =======================
// AI CHAT ENDPOINT
// =======================
app.post("/chat", async (req, res) => {
  const { userId, message } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });

  const now = Date.now();

  if (!users[userId]) {
    users[userId] = {
      freeUntil: now + FREE_HOURS * 60 * 60 * 1000,
      proUntil: 0
    };
  }

  const user = users[userId];

  if (now > user.freeUntil && now > user.proUntil) {
    return res.status(403).json({ error: "LIMIT_REACHED" });
  }

  try {
    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: message
      })
    });

    const data = await aiRes.json();

    const reply =
      data.output?.[0]?.content?.[0]?.text || "No response";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI_ERROR" });
  }
});

// =======================
// PAYSTACK VERIFY
// =======================
app.post("/verify-payment", async (req, res) => {
  const { reference, userId, plan } = req.body;

  try {
    const r = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = await r.json();

    if (data.data.status !== "success") {
      return res.status(400).json({ error: "Payment failed" });
    }

    const days =
      plan === "1w" ? 7 :
      plan === "2w" ? 14 :
      plan === "1m" ? 30 : 0;

    users[userId].proUntil =
      Date.now() + days * 24 * 60 * 60 * 1000;

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: "Verify error" });
  }
});

app.listen(3000, () => {
  console.log("✅ Tele AI Chat running");
});
