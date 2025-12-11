// server.js - Tele Tech AI backend
import express from "express";
import cors from "cors";
import fs from "fs-extra";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 10000;
const DB_FILE = process.env.DB_FILE || "./data/users.json";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY not set. /generate will fail until you set it.");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("./")); // serve index.html, image.html, style.css

// ensure data dir and file exist
await fs.ensureDir(path.dirname(DB_FILE));
if (!(await fs.pathExists(DB_FILE))) {
  await fs.writeJson(DB_FILE, { users: [] }, { spaces: 2 });
}

// simple DB helpers
async function readUsers() {
  return (await fs.readJson(DB_FILE)).users || [];
}
async function writeUsers(users) {
  await fs.writeJson(DB_FILE, { users }, { spaces: 2 });
}

// OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// helper: generate JWT
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// middleware: require auth
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const token = auth.split(" ")[1];
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------- ROUTES ----------

// register
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "username & password required" });

    const users = await readUsers();
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ success: false, message: "username taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), username, password: hashed, createdAt: new Date().toISOString() };
    users.push(user);
    await writeUsers(users);

    const token = signToken({ id: user.id, username: user.username });
    return res.json({ success: true, token });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "username & password required" });

    const users = await readUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = signToken({ id: user.id, username: user.username });
    return res.json({ success: true, token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// protected generate endpoint
app.post("/generate", requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Missing prompt" });

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: "OpenAI key not set on server" });
    }

    // Use OpenAI Images API (returns base64)
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024", // can be 512x512 or 256x256
      // n: 1, // default 1
    });

    // response.data[0].b64_json or choices depending on SDK version
    // new SDK returns response.data[0].b64_json
    const b64 = response.data?.[0]?.b64_json || response.data?.[0]?.b64 || null;

    if (!b64) {
      console.error("OpenAI image response:", response);
      return res.status(500).json({ success: false, message: "No image returned" });
    }

    const dataUrl = "data:image/png;base64," + b64;
    return res.json({ success: true, image: dataUrl });
  } catch (err) {
    console.error("GENERATE ERROR:", err?.response?.data || err.message || err);
    return res.status(500).json({ success: false, message: "Image generation failed" });
  }
});

// info route
app.get("/me", requireAuth, async (req, res) => {
  const users = await readUsers();
  const u = users.find(x => x.id === req.user.id);
  if (!u) return res.status(404).json({ success: false });
  return res.json({ success: true, user: { id: u.id, username: u.username } });
});

// fallback - serve index
app.get("*", (req, res) => {
  res.sendFile(path.resolve("./index.html"));
});

// start server
app.listen(PORT, () => {
  console.log(`Tele Tech AI backend running on port ${PORT}`);
});
