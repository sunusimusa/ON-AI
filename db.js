const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "data", "users.json");

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function findUser(email) {
  const users = getUsers();
  return users.find(u => u.email === email);
}

module.exports = {
  getUsers,
  saveUsers,
  findUser
};
