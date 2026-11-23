import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Logowanie — Angielski z Szymonem" },
      { name: "description", content: "Zaloguj się lub załóż konto ucznia." },
      { property: "og:title", content: "Logowanie — Angielski z Szymonem" },
      { property: "og:description", content: "Zaloguj się do panelu ucznia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { if (session) void nav({ to: "/panel" }); }, [session, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Nieprawidłowy e-mail lub hasło");
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/panel", data: { full_name: name } },
      });
      if (error) toast.error(error.message); else setSent(true);
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-xl font-bold">Angielski z Szymonem</Link>
        {sent ? (
          <p className="mt-8 rounded-md bg-secondary p-4">Sprawdź skrzynkę e-mail i kliknij link potwierdzający, aby aktywować konto.</p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <h1 className="font-display text-3xl">{mode === "in" ? "Zaloguj się" : "Załóż konto"}</h1>
            {mode === "up" && (
              <div><Label>Imię i nazwisko</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            )}
            <div><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Hasło</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button className="w-full" disabled={busy}>{mode === "in" ? "Zaloguj" : "Zarejestruj"}</Button>
            <button type="button" className="text-sm text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Nie masz konta? Zarejestruj się" : "Masz konto? Zaloguj się"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
