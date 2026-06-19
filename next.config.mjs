/** @type {import('next').NextConfig} */

// When building for GitHub Pages the site is served from /<repo>, so it needs a
// base path and asset prefix. Local dev and local builds serve from root, so
// the base path is only applied when GITHUB_PAGES is set (by the deploy
// workflow). The app is fully client-side, so a static export is sufficient.
const repo = "pascals-wager";
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? `/${repo}` : "",
  assetPrefix: isPages ? `/${repo}/` : "",
};

export default nextConfig;
