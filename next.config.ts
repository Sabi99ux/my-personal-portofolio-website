import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  // "/" has no page of its own: send visitors to the default locale (keep in sync with defaultLocale).
  async redirects() {
    return [{ source: '/', destination: '/en', permanent: false }];
  },
};

export default config;
