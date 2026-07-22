"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CompassIcon, HomeIcon, KeyIcon, UserIcon } from "./icons";

function Item({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${
        active ? "text-foreground" : "text-muted"
      }`}
    >
      <Icon className="h-6 w-6" />
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
    <nav className="shrink-0 border-t border-border bg-surface safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        <Item href="/" label="Feed" icon={HomeIcon} active={is("/")} />
        <Item
          href="/explore"
          label="Explore"
          icon={CompassIcon}
          active={is("/explore")}
        />
        {isSignedIn ? (
          <Item href="/me" label="You" icon={UserIcon} active={is("/me")} />
        ) : (
          <Item
            href="/sign-in"
            label="Sign in"
            icon={KeyIcon}
            active={is("/sign-in")}
          />
        )}
      </div>
    </nav>
  );
}
