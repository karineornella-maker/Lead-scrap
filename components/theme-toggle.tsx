"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground">
        <Sun className="size-4" />
        <span className="sr-only">Changer de thème</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title={isDark ? "Passer en mode clair" : "Passer en Dark Mode"}
    >
      {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-zinc-600" />}
      <span className="sr-only">Changer de thème</span>
    </Button>
  );
}
