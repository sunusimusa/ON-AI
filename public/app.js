const chat = document.getElementById("chat");
const status = document.getElementById("status");

async function send() {
  const email = document.getElementById("email").value;
  const msg = document.getElementById("msg").value;

  if (!email || !msg) return alert("Fill all fields");

  chat.innerHTML += `<p><b>You:</b> ${msg}</p>`;
  document.getElementById("msg").value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, message: msg })
  });

  const data = await res.json();

  if (data.error) {
    status.innerText = "❌ " + data.error;
  } else {
    chat.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
    status.innerText = "";
  }
}

function pay(plan) {
  const email = document.getElementById("email").value;
  if (!email) return alert("Enter email");

  const handler = PaystackPop.setup({
    key: "YOUR_PAYSTACK_PUBLIC_KEY",
    email,
    amount:
      plan === "1day" ? 50000 :
      plan === "2weeks" ? 200000 :
      300000,
    currency: "NGN",
    callback: function (res) {
      fetch("/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reference: res.reference,
          plan
        })
      }).then(() => {
        alert("✅ PRO Activated");
      });
    }
  });

  handler.openIframe();
}
