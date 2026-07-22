// HTTP 410 Gone for hacked-site spam URLs.
//
// `next.config.ts` `rewrites()` routes the spam shapes here:
//   /YYYY/MM/DD/*  (dated permalinks not in the 301 map),  /category/*,  /author/*
// We cannot use middleware/`proxy.ts` — OpenNext/Cloudflare rejects Node middleware
// (`opennextjs-cloudflare` build hard-exits), and a Next 16 proxy is always Node runtime.
// So we rewrite the spam namespaces to this route handler, which can emit any status.
// See docs/seo/DOMAIN-REPUTATION-RUNBOOK.md and docs/MIGRATION-PLAN.md.

function gone(): Response {
  return new Response("410 Gone", {
    status: 410,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
}

export function GET(): Response {
  return gone();
}

export function HEAD(): Response {
  return gone();
}
