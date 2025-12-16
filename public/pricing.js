// pricing.js

// duba ko user ya yi login
const user = localStorage.getItem("user");

if (!user) {
  alert("Please login first");
  window.location.href = "/login.html";
}
