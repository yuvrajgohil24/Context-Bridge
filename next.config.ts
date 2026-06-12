import type { NextConfig } from "next";

// No CORS headers needed: the web app calls /api/compress same-origin, and the
// Chrome extension is granted cross-origin access via host_permissions in its
// manifest, which bypasses CORS entirely.
const nextConfig: NextConfig = {};

export default nextConfig;
