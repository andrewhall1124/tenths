"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
        active ? "text-foreground" : "text-muted"
      }`}
    >
      <Icon className="h-5 w-5" />
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
      <div className="mx-auto flex h-11 max-w-lg items-stretch px-2">
        <Item href="/" label="Feed" icon={HomeIcon} active={pathname === "/"} />
        <Item
          href="/explore"
          label="Explore"
          icon={CompassIcon}
          active={pathname.startsWith("/explore")}
        />
        {signedIn ? (
          <Item href={youHref} label="You" icon={UserIcon} active={youActive} />
        ) : (
          <Item
            href="/sign-in"
            label="Sign in"
            icon={KeyIcon}
            active={pathname.startsWith("/sign-in")}
          />
        )}
      </div>
    </nav>
  );
}
