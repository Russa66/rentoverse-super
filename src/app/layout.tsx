
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: 'RentoVerse | Find Your Perfect Room',
  description: 'Intuitive room search and listing platform with AI-powered social sharing.',
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/studio-184067128-73095.firebasestorage.app/o/only%20logo.jpg?alt=media&token=13a54a46-da72-4cc0-aeb0-a422540387af',
    shortcut: 'https://firebasestorage.googleapis.com/v0/b/studio-184067128-73095.firebasestorage.app/o/only%20logo.jpg?alt=media&token=13a54a46-da72-4cc0-aeb0-a422540387af',
    apple: 'https://firebasestorage.googleapis.com/v0/b/studio-184067128-73095.firebasestorage.app/o/only%20logo.jpg?alt=media&token=13a54a46-da72-4cc0-aeb0-a422540387af',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
