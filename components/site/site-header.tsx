"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV } from "@/lib/nav";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-green text-on-green shadow-sm">
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label={`${SITE.name} home`}>
          <Image
            src="/images/brand/logo-white.png"
            alt={SITE.name}
            width={2514}
            height={2560}
            priority
            className="h-14 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) =>
            item.children ? (
              <div key={item.label} className="group relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-base font-bold text-on-green/90 transition-colors hover:text-on-green"
                >
                  {item.label}
                  <ChevronDown className="size-3.5 opacity-80" aria-hidden />
                </Link>
                <div
                  className={cn(
                    "invisible absolute left-1/2 top-full max-w-[calc(100vw-2rem)] -translate-x-1/2 translate-y-1 rounded-lg border border-line border-b-4 border-b-green bg-paper p-2 text-center opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
                    item.wide ? "grid w-[32rem] grid-cols-1 gap-x-2 sm:grid-cols-2" : "w-64",
                  )}
                >
                  {item.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className="block border-b border-line/70 px-3 py-2.5 text-center text-base text-ink transition-colors last:border-b-0 hover:bg-panel hover:text-green"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 text-base font-bold text-on-green/90 transition-colors hover:text-on-green"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-7" /> : <Menu className="size-7" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn(
          "overflow-hidden border-t border-on-green/15 bg-green-deep lg:hidden",
          open ? "max-h-[80vh] overflow-y-auto" : "max-h-0",
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile">
          {NAV.map((item) => (
            <div key={item.label} className="py-1">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-1.5 text-base font-bold text-on-green"
              >
                {item.label}
              </Link>
              {item.children && (
                <div className="ml-3 flex flex-col border-l border-on-green/20 pl-3">
                  {item.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="py-1.5 text-base text-on-green/80"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
