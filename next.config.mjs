/** @type {import('next').NextConfig} */

// When building for GitHub Pages the site is served from /<repo>, so it needs a
// base path and asset prefix. Local dev and local builds serve from root, so
// the base path is only applied when GITHUB_PAGES is set (by the deploy
// workflow). The app is fully client-side, so a static export is sufficient.
const repo = "pascals-wager";
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? `/${repo}` : "";

const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: isPages ? `/${repo}/` : "",
  // Expose the base path to client code so raw <img> tags (which Next does not
  // rewrite) can be prefixed at build time. Baking it in here keeps the
  // static-export HTML and the hydrated client in agreement; the previous
  // runtime pathname sniffing left the server-rendered src unprefixed, so the
  // images 404'd until an unrelated re-render happened to recompute them.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
