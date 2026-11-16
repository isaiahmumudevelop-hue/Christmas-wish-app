import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Christmas Wish | Verified Wishes, Delivered",
  description: "A platform connecting generous sponsors with verified wishes across Africa.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Fetch user securely on the server
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen flex flex-col">
        <Navbar user={user} />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
