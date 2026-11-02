import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion · Leadora" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm rounded-3xl border-border bg-card p-2 shadow-lg dark:shadow-none">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-300 shadow-md shadow-orange-500/25">
            <Sparkles className="size-6 text-white" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Leadora</CardTitle>
          <CardDescription className="text-xs">
            Connectez-vous à votre espace de prospection B2B
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
