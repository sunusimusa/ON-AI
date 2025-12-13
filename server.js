// ====== IMPORTS ======
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios"); // don HTTP requests

// ====== APP ======
const app = express();
const PORT = process.env.PORT || 10000;

// ====== MIDDLEWARES ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== STATIC FILES ======
app.use(express.static(path.join(__dirname, "public")));

// ====== ROUTES ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generator.html"));
});

// ====== FREE IMAGE GENERATOR (No OpenAI Needed) ======
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ success: false, message: "Please provide a prompt" });
    }

    // Amfani da public image API (source.unsplash.com)
    const imageUrl = `https://source.unsplash.com/512x512/?${encodeURIComponent(prompt)}`;

    // Aika result
    res.json({
      success: true,
      image: imageUrl,
    });

  } catch (err) {
    console.error("Error generating image:", err);
    res.json({ success: false, message: "Image generation failed" });
  }
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log("✅ Free Image API Server running on port " + PORT);
});
