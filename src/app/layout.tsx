import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'McDonald\'s Task Scheduler - Burgernomics',
  description: 'Employee task assignment and scheduling application for McDonald\'s restaurants',
  keywords: ['mcdonalds', 'task-scheduler', 'employee-management', 'restaurant'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased" style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
