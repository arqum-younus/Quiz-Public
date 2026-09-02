import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Which Velocity plan fits your app? | Cloudways",
  description:
    "Answer four questions and get the Cloudways Velocity plan that fits your Node.js app, sized on applications and bandwidth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
