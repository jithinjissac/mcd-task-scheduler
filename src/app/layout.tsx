import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'McDonald\'s Task Scheduler - Burgernomics',
  description: 'Employee task assignment and scheduling application for McDonald\'s restaurants',
  keywords: ['mcdonalds', 'task-scheduler', 'employee-management', 'restaurant'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
