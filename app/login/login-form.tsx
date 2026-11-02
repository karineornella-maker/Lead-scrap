"use client";

import { useActionState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: null });

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email" className="text-xs font-medium">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue="karineornella@gmail.com"
          autoComplete="email"
          required
          className="h-10 rounded-xl text-xs"
        />
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-medium">
            Mot de passe
          </Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          defaultValue="Karine2026!"
          autoComplete="current-password"
          required
          className="h-10 rounded-xl text-xs"
        />
      </div>

      {state.error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-10 gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-sm transition-all"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Se connecter
            <ArrowRight className="size-3.5" />
          </>
        )}
      </Button>

      <div className="rounded-xl border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Identifiants configurés :</p>
        <p>Email : <code className="font-mono text-foreground">karineornella@gmail.com</code></p>
        <p>Mot de passe : <code className="font-mono text-foreground">Karine2026!</code></p>
      </div>
    </form>
  );
}
