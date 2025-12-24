const chatBox = document.getElementById("chatBox");
const msg = document.getElementById("message");
const statusEl = document.getElementById("status");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = async () => {
  const text = msg.value.trim();
  if (!text) return;

  chatBox.innerHTML += `<p><b>You:</b> ${text}</p>`;
  msg.value = "";
  statusEl.innerText = "⏳ AI na tunani...";

  const r = await fetch("/chat", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ message: text })
  });

  const d = await r.json();

  if (d.reply) {
    chatBox.innerHTML += `<p><b>AI:</b> ${d.reply}</p>`;
    statusEl.innerText = "";
  } else {
    statusEl.innerText = d.error || "Error daga AI";
  }
};

function upgrade(days, amount) {
  const handler = PaystackPop.setup({
    key: pk_live_193ec0bed7f25a41f8d9ab473ebfdd4d55db13ba,
    email: "user@teleai.app",
    amount: amount * 100,
    currency: "NGN",
    callback: function(res) {
      fetch("/verify-payment", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ reference: res.reference, days })
      }).then(() => {
        alert("PRO activated!");
      });
    }
  });
  handler.openIframe();
}
