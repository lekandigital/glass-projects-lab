import type { Metadata } from 'next';
import 'glass-refraction/css';
import './globals.css';

export const metadata: Metadata = {
  title: 'glass-refraction — Next.js Demo',
  description: 'Liquid glass components with SVG refraction, built with glass-refraction',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
