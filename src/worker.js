export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "NowPulse",
          version: "1.0.0",
          kv: Boolean(env.NOWPULSE_KV),
          ai: Boolean(env.AI)
        }),
        {
          headers: {
            "content-type": "application/json; charset=UTF-8"
          }
        }
      );
    }

    return new Response(
      `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NowPulse</title>
<meta name="description" content="NowPulse - أحدث الأخبار والمعلومات">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  font-family:Arial,Tahoma,sans-serif;
  background:#f5f7fa;
  color:#111827;
}
header{
  background:#111827;
  color:#fff;
  padding:18px;
  text-align:center;
}
header h1{margin:0;font-size:28px}
main{
  width:min(1200px,94%);
  margin:25px auto;
}
.hero{
  background:#fff;
  border-radius:18px;
  padding:35px;
  text-align:center;
  box-shadow:0 5px 25px rgba(0,0,0,.08);
}
.hero h2{
  margin:0 0 10px;
  font-size:32px;
}
.hero p{
  color:#6b7280;
  margin:0;
}
footer{
  text-align:center;
  padding:35px 15px;
  color:#6b7280;
}
@media(max-width:700px){
  header{padding:14px}
  header h1{font-size:23px}
  main{width:94%;margin:15px auto}
  .hero{
    padding:25px 18px;
    border-radius:14px;
  }
  .hero h2{font-size:25px}
}
</style>
</head>
<body>

<header>
  <h1>NowPulse</h1>
</header>

<main>
  <section class="hero">
    <h2>آخر الأخبار</h2>
    <p>منصة NowPulse للمعلومات والأخبار.</p>
  </section>
</main>

<footer>
  Created by Taha
</footer>

</body>
</html>`,
      {
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      }
    );
  }
};
