// ===== IMPORTS =====
const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

// ===== OPENAI =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== USERS HELPERS =====
const USERS_FILE = "./users.json";

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ===== CHAT API =====
app.post("/chat", async (req, res) => {
  try {
    const { message, email } = req.body;

    if (!message || !email) {
      return res.json({ reply: "Missing message or email" });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.plan !== "pro") {
      return res.json({
        reply: "❌ Wannan feature na PRO ne. Don Allah ka upgrade."
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }]
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.json({ reply: "AI error" });
  }
});

// ===== PAYMENT INIT =====
app.post("/pay", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: "teletech_" + Date.now(),
        amount,
        currency: "NGN",
        redirect_url: "https://tele-tech-ai.onrender.com/success.html",
        customer: { email },
        customizations: {
          title: "Tele Tech AI Pro",
          description: "Upgrade to Pro"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ link: response.data.data.link });

  } catch (err) {
    console.error("PAY ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment failed" });
  }
});

// ===== WEBHOOK (AUTO UPGRADE) =====
app.post("/webhook", (req, res) => {
  const signature = req.headers["verif-hash"];

  if (signature !== process.env.FLW_WEBHOOK_SECRET) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.completed" && event.data.status === "successful") {
    const email = event.data.customer.email;
    const users = getUsers();

    let user = users.find(u => u.email === email);
    if (!user) {
      users.push({ email, plan: "pro" });
    } else {
      user.plan = "pro";
    }

    saveUsers(users);
    console.log("✅ USER UPGRADED TO PRO:", email);
  }

  res.sendStatus(200);
});

// ===== START =====
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
