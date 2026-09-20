import "./globals.css";
import ServiceWorker from "../components/ServiceWorker";

export const metadata = {
  title: "LUXE CHESS",
  description: "Premium Offline Chess",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ServiceWorker />{children}</body>
    </html>
  );
}
