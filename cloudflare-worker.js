export default {
  async fetch(request) {
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") || "hiscore").trim().toLowerCase();
    if (mode === "wiki") {
      return proxyWiki(url);
    }
    return proxyHiscore(url);
  },
};

async function proxyHiscore(url) {
    const player = (url.searchParams.get("player") || "").trim();
    if (!player) {
      return new Response("Missing player parameter.", { status: 400 });
    }

    const encoded = encodeURIComponent(player);
    const endpoints = [
      `https://services.runescape.com/m=hiscore/index_lite.ws?player=${encoded}`,
      `https://secure.runescape.com/m=hiscore/index_lite.ws?player=${encoded}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "GET",
          headers: { "User-Agent": "SkillCalculatorWeb/1.0" },
        });
        if (res.ok) {
          const text = await res.text();
          return new Response(text, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8",
              "Cache-Control": "no-store",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch {
      }
    }

    return new Response("Hiscore proxy failed.", {
      status: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
}

async function proxyWiki(url) {
  const path = (url.searchParams.get("path") || "").trim();
  if (!path.startsWith("/api.php?")) {
    return new Response("Invalid wiki path parameter.", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const endpoint = `https://runescape.wiki${path}`;
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { "User-Agent": "SkillCalculatorWeb/1.0" },
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Wiki proxy failed.", {
      status: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}
