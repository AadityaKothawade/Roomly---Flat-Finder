"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";

export default function Nav({ dbUser }) {
  const pathname = usePathname();

  const needsOnboarding = dbUser && !dbUser.role;

  const links = [{ href: "/listings", label: "Browse rooms" }];
  if (dbUser?.role === "owner") {
    links.push({ href: "/owner/dashboard", label: "My listings" });
  }
  if (dbUser?.role === "tenant") {
    links.push({ href: "/tenant/profile", label: "My preferences" });
  }

  return (
    <header className="border-b border-ink/10 sticky top-0 bg-parchment/95 backdrop-blur z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          Roomly
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive ? "text-ink font-medium border-b-2 border-moss pb-1" : "text-ink/70 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {needsOnboarding && (
            <Link
              href="/onboarding"
              className="text-brass font-medium underline decoration-dotted"
            >
              Finish setup
            </Link>
          )}

          <ThemeToggle />

          {dbUser ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Link href="/sign-in" className="px-3 py-1.5 bg-ink text-parchment rounded-card">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
