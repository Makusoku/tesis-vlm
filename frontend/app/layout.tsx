import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroCafeLLM",
  description: "Plataforma de anotacion experta para imagenes foliares de cafe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
