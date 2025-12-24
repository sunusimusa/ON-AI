const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("message");
const statusEl = document.getElementById("status");

/* SEND MESSAGE */
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

  } catch (err) {
    statusEl.innerText = "❌ Network error";
  }
});

function addMsg(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${sender}:</b> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* UPGRADE BUTTONS (TEST MODE) */
document.querySelectorAll(".upgrade").forEach(btn => {
  btn.addEventListener("click", () => {
    const days = btn.dataset.days;
    const amount = btn.dataset.amount;
    alert(`Upgrade clicked: ₦${amount} for ${days} days`);
  });
});
