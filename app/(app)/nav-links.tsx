"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/campaigns", label: "Campagnes", icon: Megaphone },
  { href: "/leads", label: "Leads", icon: Users },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            pathname.startsWith(href) && "bg-muted font-medium text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
