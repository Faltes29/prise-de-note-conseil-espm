import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Bulletin ESPM",
  description: "Outil de prise de notes et de génération de commentaires de bulletin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
