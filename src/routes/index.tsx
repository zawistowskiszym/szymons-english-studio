import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Angielski z Szymonem — korepetycje z angielskiego" },
      { name: "description", content: "Korepetycje z angielskiego w Warszawie i online: szkoła podstawowa, egzamin ósmoklasisty, matura podstawowa. Od 50 zł/h, pierwsza lekcja próbna gratis." },
      { property: "og:title", content: "Angielski z Szymonem" },
      { property: "og:description", content: "Korepetycje z angielskiego: podstawówka, ósmoklasista, matura podstawowa. Online lub z dojazdem w Warszawie." },
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
          Korepetycje z angielskiego dla uczniów szkoły podstawowej — z przygotowaniem do egzaminu ósmoklasisty i matury podstawowej. Terminy, materiały i zadania domowe masz w jednym miejscu.
        </p>
        <div className="mt-10 flex gap-3">
          <Button asChild size="lg"><Link to="/login">Załóż konto ucznia</Link></Button>
          <Button asChild size="lg" variant="outline"><a href="#cennik">Zobacz cennik</a></Button>
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

        <section id="o-mnie" className="mt-28 grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">O mnie</p>
            <h2 className="font-display text-4xl font-bold leading-tight">Cześć, jestem Szymon!</h2>
            <p className="mt-3 text-muted-foreground">
              Uczę się w klasie maturalnej XXXIII LO Dwujęzycznego im. M. Kopernika w Warszawie.
            </p>
          </div>
          <div className="space-y-4 text-lg md:col-span-3">
            <p>
              Od dziecka interesuję się angielskim i chcę przekazać tę pasję również Tobie. Lubię tłumaczyć trudne
              zagadnienia i zależy mi, żebyś zrozumiał(a) temat, a nie tylko go „wykuł(a)”.
            </p>
            <p>
              Jestem cierpliwy, wyrozumiały i staranny — zadania wykonuję rzetelnie. Chętnie zaangażuję się też poza
              lekcjami: odpowiem na pytanie albo przygotuję materiały na zajęcia.
            </p>
            <p>
              Sam przygotowuję się do matury, więc dobrze znam wymagania szkolne i egzaminacyjne i wiem, jak skutecznie
              im sprostać.
            </p>
          </div>
        </section>

        <section id="oferta" className="mt-28">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">Oferta</p>
          <h2 className="font-display text-4xl font-bold">W czym pomogę</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Lekcje na poziomie szkoły podstawowej, w tym przygotowanie do egzaminu ósmoklasisty i matury podstawowej.
          </p>
          <ul className="mt-8 grid gap-x-10 gap-y-3 md:grid-cols-2">
            {[
              "Przygotowanie do egzaminu ósmoklasisty i matury",
              "Nadrobienie zaległości",
              "Zrozumienie bieżącego materiału ze szkoły",
              "Przygotowanie do sprawdzianów, kartkówek i egzaminów",
              "Pomoc w pracach domowych",
            ].map((t) => (
              <li key={t} className="border-t border-border pt-3">{t}</li>
            ))}
          </ul>
        </section>

        <section id="cennik" className="mt-28">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">Cennik</p>
          <h2 className="font-display text-4xl font-bold">Prosto i bez niespodzianek</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              ["Online", "50 zł", "za godzinę (60 min)", "Lekcje zdalne — wystarczy komputer i internet."],
              ["Z dojazdem", "60 zł", "za godzinę (60 min)", "Dojeżdżam do ucznia na terenie Warszawy i bliskich okolic."],
            ].map(([t, price, unit, d]) => (
              <div key={t} className="rounded-lg border border-border p-6">
                <h3 className="font-display text-2xl">{t}</h3>
                <p className="mt-3 font-display text-5xl font-bold text-primary">{price}</p>
                <p className="text-sm text-muted-foreground">{unit}</p>
                <p className="mt-4 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-lg bg-accent/20 p-4">
            <strong>Pierwsza lekcja próbna jest bezpłatna.</strong> Poznamy się i sprawdzimy, czy współpraca Ci odpowiada.
          </p>
          <div className="mt-8">
            <Button asChild size="lg"><Link to="/login">Umów lekcję próbną</Link></Button>
          </div>
        </section>
      </main>
    </div>
  );
}
