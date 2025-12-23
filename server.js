import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// ================= IMAGE GENERATION =================
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.length < 3) {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const enhancedPrompt = `High quality, ultra realistic image of: ${prompt}, detailed, sharp focus, professional photography`;

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
          prompt: enhancedPrompt,
          size: "1024x1024"
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return res.status(500).json({ error: "Image generation failed" });
    }

    const data = await response.json();

    if (!data.data || !data.data[0]?.url) {
      return res.status(500).json({ error: "No image returned" });
    }

    res.json({ image: data.data[0].url });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
