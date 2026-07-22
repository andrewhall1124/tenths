"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Item({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 items-center justify-center py-2.5 text-[11px] uppercase tracking-wide ${
        active ? "text-foreground" : "text-muted"
      }`}
    >
      {label}
    </Link>
  );
}

export function BottomNav({ meHandle }: { meHandle: string | null }) {
  const pathname = usePathname();
  const signedIn = meHandle != null;
  const youHref = meHandle ? `/u/${meHandle}` : "/me";
  const youActive =
    pathname === "/me" || (meHandle ? pathname === `/u/${meHandle}` : false);

  return (
    <nav className="shrink-0 border-t border-border bg-background safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        <Item href="/" label="Feed" active={pathname === "/"} />
        <Item
          href="/explore"
          label="Explore"
          active={pathname.startsWith("/explore")}
        />
        {signedIn ? (
          <Item href={youHref} label="You" active={youActive} />
        ) : (
          <Item
            href="/sign-in"
            label="Sign in"
            active={pathname.startsWith("/sign-in")}
          />
        )}
      </div>
    </nav>
  );
}
