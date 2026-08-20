import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LazoDePlata",
  description:
    "Plata simulada para aprender a administrar — proyecto educativo sin dinero real.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}