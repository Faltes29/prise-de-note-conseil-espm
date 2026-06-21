import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conseil de classe",
  description: "Outil de prise de notes pour les conseils de classe",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
