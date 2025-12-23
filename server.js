import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

/* ================= HEALTH CHECK ================= */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================= PAYSTACK VERIFY ================= */
app.post("/verify-payment", async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ success: false, message: "No reference" });
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
      return res.json({
        success: true,
        amount: data.data.amount,
        email: data.data.customer.email
      });
    } else {
      return res.status(400).json({ success: false });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
