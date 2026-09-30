export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      let kv = false;
      let ai = false;

      try {
        if (env.NOWPULSE_KV) {
          await env.NOWPULSE_KV.put(
            "nowpulse_health",
            new Date().toISOString(),
            { expirationTtl: 300 }
          );

          kv = true;
        }
      } catch (error) {
        kv = false;
      }

      try {
        if (env.AI) {
          const result = await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct",
            {
              messages: [
                {
                  role: "user",
                  content: "Reply with exactly: OK"
                }
              ],
              max_tokens: 10
            }
          );

          ai = Boolean(result);
        }
      } catch (error) {
        ai = false;
      }

      return new Response(
        JSON.stringify(
          {
            ok: true,
            service: "NowPulse",
            kv,
            ai,
            time: new Date().toISOString()
          },
          null,
          2
        ),
        {
          headers: {
            "content-type": "application/json; charset=UTF-8"
          }
        }
      );
    }

    return new Response("NowPulse is running.", {
      headers: {
        "content-type": "text/plain; charset=UTF-8"
      }
    });
  }
};
