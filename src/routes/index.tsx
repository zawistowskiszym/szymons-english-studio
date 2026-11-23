import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Angielski z Szymonem — korepetycje z angielskiego" },
      { name: "description", content: "Indywidualne lekcje angielskiego z Szymonem. Grafik, materiały i zadania domowe w jednym panelu ucznia." },
      { property: "og:title", content: "Angielski z Szymonem" },
      { property: "og:description", content: "Indywidualne lekcje angielskiego. Panel ucznia z grafikiem, materiałami i zadaniami." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { session } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-bold">Angielski z Szymonem</span>
        <Button asChild variant="outline"><Link to={session ? "/panel" : "/login"}>{session ? "Mój panel" : "Zaloguj się"}</Link></Button>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">Korepetycje 1:1</p>
        <h1 className="max-w-3xl font-display text-5xl font-bold leading-tight md:text-7xl">
          Mów po angielsku <span className="italic text-primary">swobodnie</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Lekcje dopasowane do Ciebie — od matury po rozmowy w pracy. Wszystkie terminy, materiały i zadania domowe masz w jednym miejscu.
        </p>
        <div className="mt-10 flex gap-3">
          <Button asChild size="lg"><Link to="/login">Załóż konto ucznia</Link></Button>
        </div>
        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            ["Grafik", "Zawsze wiesz, kiedy jest następna lekcja."],
            ["Materiały", "Notatki, linki i ćwiczenia po każdych zajęciach."],
            ["Zadania domowe", "Oddajesz online, dostajesz ocenę i komentarz."],
          ].map(([t, d]) => (
            <div key={t} className="border-t-2 border-accent pt-4">
              <h3 className="font-display text-2xl">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
