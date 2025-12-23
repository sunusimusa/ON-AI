async function send() {
  const msg = document.getElementById("msg").value;
  if (!msg) return;

  document.getElementById("status").innerText = "⏳ AI na tunani...";
  document.getElementById("reply").innerText = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();

    if (data.reply) {
      document.getElementById("reply").innerText = data.reply;
      document.getElementById("status").innerText = "✅ An amsa";
    } else {
      document.getElementById("status").innerText = "❌ AI error";
    }
  } catch (e) {
    document.getElementById("status").innerText = "❌ Network error";
  }
}
