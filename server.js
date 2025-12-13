const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public","login.html"));
});

app.get("/generator",(req,res)=>{
  res.sendFile(path.join(__dirname,"public","generator.html"));
});

app.post("/generate",(req,res)=>{
  const { prompt } = req.body;
  if (!prompt) {
    return res.json({success:false});
  }

  const image = "https://source.unsplash.com/512x512/?" +
    encodeURIComponent(prompt);

  res.json({
    success:true,
    image
  });
});

app.listen(PORT,()=>{
  console.log("✅ Free AI running on port " + PORT);
});
