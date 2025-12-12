// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve all HTML + CSS

// Load users DB
const usersFile = path.join(__dirname, "data", "users.json");

// Ensure users.json exists
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

// Register Endpoint
app.post("/api/register", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Missing email or password" });
    }

    const users = JSON.parse(fs.readFileSync(usersFile));

    const existing = users.find((u) => u.email === email);
    if (existing) {
        return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = bcrypt.hashSync(password, 10);

    users.push({ email, password: hashed });
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    return res.json({ message: "User registered successfully" });
});

// Login Endpoint
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    const users = JSON.parse(fs.readFileSync(usersFile));
    const user = users.find((u) => u.email === email);

    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "24h",
    });

    return res.json({ token });
});

// Protect Route Example
function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Missing token" });

    const token = header.split(" ")[1];

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// Example protected generator route
app.post("/api/generate", auth, async (req, res) => {
    return res.json({ result: "AI generated content here" });
});

// IMPORTANT for Render
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
