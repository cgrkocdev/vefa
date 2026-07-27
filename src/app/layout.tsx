import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vefa | Bağış Yönetimi",
  description: "Tarayıcı tabanlı hızlı bağış ve kurban yönetim sistemi",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
