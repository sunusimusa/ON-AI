const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("message");
const statusEl = document.getElementById("status");

/* ================= CHAT ================= */
sendBtn.addEventListener("click", async () => {
  const text = messageInput.value.trim();
  if (!text) return;

  addMsg("You", text);
  messageInput.value = "";
  statusEl.innerText = "⏳ AI na tunani...";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.reply) {
      addMsg("AI", data.reply);
      statusEl.innerText = "";
    } else {
      statusEl.innerText = "❌ Error daga AI";
    }
  } catch {
    statusEl.innerText = "❌ Network error";
  }
});

function addMsg(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${sender}:</b> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ================= PAYSTACK ================= */
document.querySelectorAll(".upgradeBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const days = btn.dataset.days;
    const amount = btn.dataset.amount;

    PaystackPop.setup({
      key: "pk_live_193ec0bed7f25a41f8d9ab473ebfdd4d55db13ba", // 🔴 saka public key
      email: "user@teleai.app",
      amount: amount * 100,
      currency: "NGN",
      callback: function (response) {
        statusEl.innerText = "✅ Payment successful!";
        fetch("/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: response.reference, days })
        });
      }
    }).openIframe();
  });
});
