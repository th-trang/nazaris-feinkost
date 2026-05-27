import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./app/i18n.ts");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/.well-known/apple-developer-merchantid-domain-association",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
