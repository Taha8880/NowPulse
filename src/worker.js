export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      const result = {
        ok: true,
        service: "NowPulse",
        bindings: {
          kv_exists: Boolean(env.NOWPULSE_KV),
          ai_exists: Boolean(env.AI)
        },
        kv: {
          ok: false,
          error: null
        },
        ai: {
          ok: false,
          error: null
        },
        cron: "enabled",
        time: new Date().toISOString()
      };

      try {
        if (!env.NOWPULSE_KV) {
          throw new Error("NOWPULSE_KV binding is missing");
        }

        await env.NOWPULSE_KV.put(
          "nowpulse_health",
          new Date().toISOString(),
          {
            expirationTtl: 300
          }
        );

        result.kv.ok = true;
      } catch (error) {
        result.kv.error = String(error?.message || error);
      }

      try {
        if (!env.AI) {
          throw new Error("AI binding is missing");
        }

        const aiResult = await env.AI.run(
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

        result.ai.ok = Boolean(aiResult);
      } catch (error) {
        result.ai.error = String(error?.message || error);
      }

      return new Response(
        JSON.stringify(result, null, 2),
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
  },

  async scheduled(event, env, ctx) {
    try {
      if (env.NOWPULSE_KV) {
        await env.NOWPULSE_KV.put(
          "nowpulse_cron_last_run",
          JSON.stringify({
            cron: event.cron,
            scheduledTime: event.scheduledTime,
            executedAt: new Date().toISOString()
          }),
          {
            expirationTtl: 86400
          }
        );
      }
    } catch (error) {
      // Cron must not fail because of KV errors.
    }
  }
};
