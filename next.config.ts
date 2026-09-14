import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin uses native Node.js modules (grpc, http2, etc.) that
  // cannot be bundled by webpack/turbopack. Listing the package AND every
  // sub-path export we import ensures Next.js always resolves them via the
  // native Node.js `require` at runtime instead of attempting to bundle them.
  // jose@6 is pure ESM and jwks-rsa@4 (a firebase-admin/auth transitive dep)
  // tries to require() it — listing both prevents ERR_REQUIRE_ESM at build time.
  serverExternalPackages: [
    "firebase-admin",
    "firebase-admin/app",
    "firebase-admin/auth",
    "firebase-admin/firestore",
    "jose",
    "jwks-rsa",
  ],
};

export default nextConfig;
