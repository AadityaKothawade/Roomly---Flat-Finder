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
    links.unshift({ href: "/owner/dashboard", label: "My listings" });
  }
  if (dbUser?.role === "tenant") {
    links.push({ href: "/tenant/profile", label: "My preferences" });
  }
  if (dbUser?.role === "admin") {
    links.push({ href: "/admin", label: "Admin" });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-parchment/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-lg text-ink flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-moss" aria-hidden="true" />
          Roomly
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-ink/8 text-ink font-medium"
                    : "text-ink/60 hover:text-ink hover:bg-ink/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {needsOnboarding && (
            <Link href="/onboarding" className="px-3 py-1.5 text-brass font-medium text-sm hover:bg-brass/10 rounded-lg">
              Finish setup
            </Link>
          )}

          <div className="w-px h-5 bg-ink/10 mx-1 hidden sm:block" aria-hidden="true" />

          <ThemeToggle />

          {dbUser ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Link href="/sign-in" className="btn-primary !py-1.5 !px-3.5 text-xs sm:text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
