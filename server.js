const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const OpenAI = require("openai");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || 10000;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
/* ================= OPENAI ================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ================= ADMIN ================= */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
let ADMIN_TOKEN = "";

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const users = getUsers();
  const user = users.find(
    u => u.email === email && u.password === hashPassword(password)
  );

  if (!user) {
    return res.json({ error: "Invalid login" });
  }

  res.json({
    success: true,
    email: user.email,
    plan: user.plan
  });
});

/* ================= USERS STORAGE ================= */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const USERS_FILE = path.join(__dirname, "data", "users.json");

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ error: "Missing email or password" });
  }

  const users = getUsers();
  const exists = users.find(u => u.email === email);

  if (exists) {
    return res.json({ error: "User already exists" });
  }

  users.push({
    email,
    password: hashPassword(password),
    plan: "free"
  });

  saveUsers(users);

  res.json({ success: true });
});

/* ================= CHAT ================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, email } = req.body;
    if (!message || !email) {
      return res.json({ reply: "Missing message or email" });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);
    const isPro = user && user.plan === "pro";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content,
      pro: isPro
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.json({ reply: "AI error" });
  }
});

/* ================= IMAGE (PRO) ================= */
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt, email } = req.body;
    if (!prompt || !email) {
      return res.json({ error: "Missing prompt or email" });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.plan !== "pro") {
      return res.json({
        error: "❌ Wannan feature na PRO ne"
      });
    }

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    res.json({ image: image.data[0].url });

  } catch (err) {
    console.error("IMAGE ERROR:", err);
    res.json({ error: "Image failed" });
  }
});

/* ================= PAYMENT INIT ================= */
app.post("/pay", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: "tele_" + Date.now(),
        amount,
        currency: "NGN",
        redirect_url: "https://tele-tech-ai.onrender.com/",
        customer: { email },
        customizations: {
          title: "Tele Tech AI Pro",
          description: "Pro Subscription"
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
    console.error("PAY ERROR:", err.message);
    res.json({ error: "Payment failed" });
  }
});

/* ================= WEBHOOK ================= */
app.post("/webhook", (req, res) => {
  const signature = req.headers["verif-hash"];
  if (signature !== process.env.FLW_WEBHOOK_SECRET) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.completed" && event.data.status === "successful") {
    const email = event.data.customer.email;
    let users = getUsers();
    let user = users.find(u => u.email === email);

    if (user) user.plan = "pro";
    else users.push({ email, plan: "pro" });

    saveUsers(users);
    console.log("✅ PRO USER:", email);
  }

  res.send("OK");
});

/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    ADMIN_TOKEN = "admin-" + Date.now();
    return res.json({ token: ADMIN_TOKEN });
  }
  res.status(401).json({ error: "Wrong password" });
});

/* ================= ADMIN USERS ================= */
app.get("/admin/users", (req, res) => {
  if (req.headers.authorization !== ADMIN_TOKEN) {
    return res.status(401).send("Unauthorized");
  }
  res.json(getUsers());
});

/* ================= ADMIN TOGGLE ================= */
app.post("/admin/toggle", (req, res) => {
  if (req.headers.authorization !== ADMIN_TOKEN) {
    return res.status(401).send("Unauthorized");
  }

  const { email } = req.body;
  let users = getUsers();
  let user = users.find(u => u.email === email);

  if (user) {
    user.plan = user.plan === "pro" ? "free" : "pro";
    saveUsers(users);
  }

  res.json({ success: true });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
