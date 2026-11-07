import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  outputFileTracingRoot: path.join(__dirname),
};

export default config;
