import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biblioteca Virtual UNES | Registro de Visitas",
  description: "Sistema institucional de registro y control de visitas de la Biblioteca Virtual UNES.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
