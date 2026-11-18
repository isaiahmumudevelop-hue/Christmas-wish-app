"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

type User = { id: string; name: string; role: string };

export default function Navbar({ user }: { user: User | null }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { name: "Home", href: "/", show: true },
    { name: "Dashboard", href: "/dashboard", show: !!user },
    { name: "Admin Home", href: "/admin", show: user?.role === "admin" || user?.role === "reviewer" },
    { name: "Wish Queue", href: "/admin/wishes", show: user?.role === "admin" || user?.role === "reviewer" },
    { name: "Sponsor Queue", href: "/admin/sponsors", show: user?.role === "admin" || user?.role === "reviewer" },
    { name: "Sponsor", href: "/sponsor/wishes", show: user?.role === "sponsor" || user?.role === "admin" },
  ];

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎄</span>
          <span className="font-bold text-xl text-gray-900 tracking-tight">Christmas Wish</span>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.filter(l => l.show).map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors ${pathname === link.href ? "text-rose-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-rose-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Log in</Link>
              <Link href="/signup" className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
