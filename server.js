const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

/* ================== MEMORY STORE ==================
   (temporary – daga baya za mu koma DB)
================================================== */
const usage = {}; // { ip: count }
const FREE_LIMIT = 3;

/* ================== MIDDLEWARE ================== */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================== HOME ================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================== GENERATE IMAGE ================== */
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ error: "Prompt required" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  usage[ip] = usage[ip] || 0;

  // ❌ FREE LIMIT REACHED
  if (usage[ip] >= FREE_LIMIT) {
    return res.status(403).json({
      error: "Free limit reached",
      pay: true
    });
  }

  usage[ip] += 1;

  const imageUrl =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt);

  res.json({
    success: true,
    image: imageUrl,
    remaining: FREE_LIMIT - usage[ip]
  });
});

/* ================== PAYMENT PLACEHOLDER ================== */
/*
  Nan ne za mu saka:
  - Paystack initialize
  - Flutterwave checkout
*/
app.post("/pay", (req, res) => {
  res.json({
    message: "Payment coming soon",
    amount: 200 // ₦200 example
  });
});

/* ================== START ================== */
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
