export default {
  async fetch() {
    return new Response("NowPulse GitHub source is ready", {
      headers: { "content-type": "text/plain; charset=UTF-8" }
    });
  }
};
