const FREE_HOURS = 8;
const STORAGE_KEY = "tele_free_start";

function canUseFree() {
  const start = localStorage.getItem(STORAGE_KEY);
  if (!start) {
    localStorage.setItem(STORAGE_KEY, Date.now());
    return true;
  }
  const hoursPassed = (Date.now() - start) / (1000 * 60 * 60);
  return hoursPassed < FREE_HOURS;
}

async function sendMessage() {
  if (!canUseFree()) {
    document.getElementById("status").innerText =
      "⛔ Free limit reached. Please upgrade.";
    return;
  }

  const msg = document.getElementById("message").value;
  document.getElementById("status").innerText = "⏳ Thinking...";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();

  if (data.reply) {
    document.getElementById("reply").innerText = data.reply;
    document.getElementById("status").innerText = "✅";
  } else {
    document.getElementById("status").innerText = "❌ AI error";
  }
}

/* =========================
   PAYSTACK
========================= */
function pay(plan) {
  const prices = {
    week: 500,
    "2weeks": 900,
    month: 1500
  };

  const handler = PaystackPop.setup({
    key: window.PAYSTACK_PUBLIC_KEY || "pk_live_xxxxx",
    email: "user@teleai.chat",
    amount: prices[plan] * 100,
    currency: "NGN",
    callback: function (response) {
      verifyPayment(response.reference);
    }
  });

  handler.openIframe();
}

async function verifyPayment(reference) {
  const res = await fetch("/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference })
  });

  const data = await res.json();

  if (data.success) {
    document.getElementById("status").innerText =
      "✅ Pro unlocked!";
    localStorage.removeItem(STORAGE_KEY);
  } else {
    document.getElementById("status").innerText =
      "❌ Payment verification failed";
  }
}
