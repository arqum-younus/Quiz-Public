/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: 'export'` here on purpose. This app has an API route and
  // needs a persistent Node process, which is what Velocity provides.
};

export default nextConfig;
