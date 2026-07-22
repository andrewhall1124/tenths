"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

function Item({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
        active ? "text-accent" : "text-muted"
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      {label}
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const is = (p: string) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        <Item href="/" label="Feed" icon="🏠" active={is("/")} />
        <Item href="/explore" label="Explore" icon="🧭" active={is("/explore")} />
        {isSignedIn ? (
          <>
            <Link
              href="/rate"
              className="flex flex-1 flex-col items-center justify-center"
              aria-label="Add a rating"
            >
              <span className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-ink shadow-lg shadow-accent/20">
                +
              </span>
            </Link>
            <Item href="/me" label="You" icon="👤" active={is("/me")} />
          </>
        ) : (
          <Item
            href="/sign-in"
            label="Sign in"
            icon="🔑"
            active={is("/sign-in")}
          />
        )}
      </div>
    </nav>
  );
}
