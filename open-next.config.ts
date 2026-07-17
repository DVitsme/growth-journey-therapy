import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// OpenNext serves `generateStaticParams` (SSG) prerenders THROUGH the incremental cache —
// with no cache configured, every dynamic-segment route 404s on Workers. This site is fully
// prerendered with no ISR/revalidation, so the read-only static-assets cache is the right fit
// (prerenders ship inside the assets bundle; no R2/KV binding needed). If ISR/`use cache` is
// ever adopted, switch to an R2/KV incremental cache + matching wrangler.jsonc binding.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
