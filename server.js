import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// ===== PATH FIX (ESM) =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== ENV KEYS =====
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

if (!OPENAI_KEY) {
  console.error("❌ OPENAI_API_KEY missing");
}
if (!PAYSTACK_SECRET) {
  console.error("❌ PAYSTACK_SECRET_KEY missing");
}

// ===============================
// IMAGE GENERATION (REAL)
// ===============================
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length < 3) {
      return res.status(400).json({
        error: "Prompt is required"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: `High quality realistic image of: ${prompt}`,
          size: "1024x1024"
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("OPENAI ERROR:", errText);
      return res.status(500).json({
        error: "Image generation failed"
      });
    }

    const data = await response.json();

    if (!data.data || !data.data[0]?.url) {
      return res.status(500).json({
        error: "Invalid image response"
      });
    }

    res.json({
      image: data.data[0].url
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({
      error: "Server error"
    });
  }
});

// ===============================
// PAYSTACK VERIFY (REAL)
// ===============================
app.post("/verify-payment", async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: "Missing reference"
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      return res.json({ success: true });
    }

    res.status(400).json({
      success: false,
      error: "Payment not successful"
    });

  } catch (err) {
    console.error("PAYSTACK ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Verification failed"
    });
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
