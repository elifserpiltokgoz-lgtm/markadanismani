export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname !== "/api") return env.ASSETS.fetch(req);
    if (req.method !== "POST") return new Response("OK");
    try {
      const { messages } = await req.json();
      const contents = messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content).slice(0, 12000) }]
      }));
      const model = env.MODEL || "gemini-flash-latest";
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY },
          body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 8192, temperature: 0.8 } })
        }
      );
      if (!r.ok) return new Response("err", { status: r.status });
      const j = await r.json();
      const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
      return Response.json({ text });
    } catch (e) {
      return new Response("err", { status: 500 });
    }
  }
};
