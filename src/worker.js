export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Root endpoint
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("OK", { status: 200 });
    }
    
    // GET /notify - Test endpoint for browser testing
    if (request.method === "GET" && url.pathname === "/notify") {
      const text = "✅ Test notification from browser - Your Worker is working!";
      const resp = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ chat_id: env.CHAT_ID, text })
      });
      
      if (!resp.ok) {
        const err = await resp.text();
        return new Response(JSON.stringify({ ok: false, error: err }), { 
          status: 502, 
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response("Notification sent! Check your Telegram.", { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    // POST /notify or /vercel-webhook - Webhook endpoints
    if (request.method === "POST" && (url.pathname === "/notify" || url.pathname === "/vercel-webhook")) {
      let body = {};
      try { body = await request.json(); } catch {}
      
      const type = (body.type || body.event || "").toString().toLowerCase();
      const ok = body.ok ?? !/(error|failed|canceled)/i.test(type);
      const project = body?.project?.name || body?.payload?.name || body.label || "task";
      const link = body?.deployment?.url || body?.payload?.url || "";
      
      let text = "";
      if (url.pathname === "/notify") {
        text = ok ? `✅ Codex done: ${project}` : `❌ Codex failed: ${project}`;
      } else {
        const emoji = /created/.test(type) ? "📦" : /(ready|succeeded)/.test(type) ? "🚀" : /(error|canceled)/.test(type) ? "🔥" : "ℹ️";
        text = `${emoji} ${project}: ${type}${link ? ` ${link}` : ""}`;
      }
      
      const resp = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ chat_id: env.CHAT_ID, text })
      });
      
      if (!resp.ok) {
        const err = await resp.text();
        return new Response(JSON.stringify({ ok: false, error: err }), { 
          status: 502, 
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response("Not found", { status: 404 });
  }
}
