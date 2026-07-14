import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Web Glass Effect Demo',
  description: 'iTunes-style demo using @creatorem/web-glass-effect',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
