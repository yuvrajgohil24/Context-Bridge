"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowsLeftRight, GithubLogo } from "@phosphor-icons/react/dist/ssr";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/playground", label: "Playground" },
  { href: "/history", label: "History" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
            <ArrowsLeftRight size={18} weight="bold" />
          </span>
          <span className="font-display text-lg font-semibold text-ink tracking-tight">
            ContextBridge
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active ? "text-ink bg-subtle" : "text-muted hover:text-ink hover:bg-subtle"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href="https://github.com/yuvrajgohil24/Context-Bridge"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted hover:text-ink hover:bg-subtle transition-colors flex items-center gap-1.5"
          >
            <GithubLogo size={18} weight="fill" />
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
