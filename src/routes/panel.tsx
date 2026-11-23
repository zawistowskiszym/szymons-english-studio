import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel — Angielski z Szymonem" },
      { name: "description", content: "Twój grafik lekcji, materiały i zadania domowe." },
      { property: "og:title", content: "Panel — Angielski z Szymonem" },
      { property: "og:description", content: "Grafik, materiały i zadania domowe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Panel,
});

const fmt = (d: string) => new Date(d).toLocaleString("pl-PL", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

function useData() {
  const students = useQuery({ queryKey: ["students"], queryFn: async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return [];
    const { data } = await supabase.from("profiles").select("*").in("id", ids).order("full_name");
    return data ?? [];
  }});
  const lessons = useQuery({ queryKey: ["lessons"], queryFn: async () => (await supabase.from("lessons").select("*").order("starts_at")).data ?? [] });
  const materials = useQuery({ queryKey: ["materials"], queryFn: async () => (await supabase.from("materials").select("*").order("created_at", { ascending: false })).data ?? [] });
  const homework = useQuery({ queryKey: ["homework"], queryFn: async () => (await supabase.from("homework").select("*").order("due_date")).data ?? [] });
  return { students: students.data ?? [], lessons: lessons.data ?? [], materials: materials.data ?? [], homework: homework.data ?? [] };
}

function Panel() {
  const { session, role, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !session) void nav({ to: "/login" }); }, [loading, session, nav]);
  if (loading || !session) return <div className="p-10 text-muted-foreground">Ładowanie…</div>;
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-xl font-bold">Angielski z Szymonem</Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{role === "tutor" ? "Korepetytor" : "Uczeń"}</Badge>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>Wyloguj</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{role === "tutor" ? <TutorPanel /> : <StudentPanel userId={session.user.id} />}</main>
    </div>
  );
}

function useSave(table: "lessons" | "materials" | "homework") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: unknown }>) => { const { error } = await fn(); if (error) throw error; },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [table] }); toast.success("Zapisano"); },
    onError: () => toast.error("Nie udało się zapisać"),
  });
}

function TutorPanel() {
  const { students, lessons, materials, homework } = useData();
  const name = (id: string | null) => (id ? students.find((s) => s.id === id)?.full_name || "Uczeń" : "Wszyscy uczniowie");
  const lessonSave = useSave("lessons"), matSave = useSave("materials"), hwSave = useSave("homework");
  const StudentSelect = ({ allowAll = false }: { allowAll?: boolean }) => (
    <select name="student" required={!allowAll} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
      {allowAll ? <option value="">Wszyscy uczniowie</option> : <option value="">Wybierz ucznia…</option>}
      {students.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
    </select>
  );
  const upcoming = lessons.filter((l) => new Date(l.starts_at) >= new Date(Date.now() - 36e5));

  return (
    <Tabs defaultValue="schedule">
      <TabsList><TabsTrigger value="schedule">Grafik</TabsTrigger><TabsTrigger value="students">Uczniowie ({students.length})</TabsTrigger><TabsTrigger value="materials">Materiały</TabsTrigger><TabsTrigger value="homework">Zadania</TabsTrigger></TabsList>

      <TabsContent value="schedule" className="grid gap-8 md:grid-cols-[1fr_320px]">
        <section><h2 className="mb-4 text-2xl">Nadchodzące lekcje</h2>
          {upcoming.length === 0 && <p className="text-muted-foreground">Brak zaplanowanych lekcji.</p>}
          <ul className="space-y-2">{upcoming.map((l) => (
            <li key={l.id} className="flex items-center justify-between rounded-md border bg-card p-3">
              <div><div className="font-medium">{fmt(l.starts_at)} · {l.duration_min} min</div><div className="text-sm text-muted-foreground">{name(l.student_id)}{l.topic && ` — ${l.topic}`}</div></div>
              <Button variant="ghost" size="sm" onClick={() => lessonSave.mutate(() => supabase.from("lessons").delete().eq("id", l.id))}>Usuń</Button>
            </li>))}</ul>
        </section>
        <form className="space-y-3 rounded-md border bg-card p-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const el = e.currentTarget;
          lessonSave.mutate(() => supabase.from("lessons").insert({ student_id: String(f.get("student")), starts_at: new Date(String(f.get("when"))).toISOString(), duration_min: Number(f.get("dur")), topic: String(f.get("topic")) }), { onSuccess: () => el.reset() }); }}>
          <h3 className="text-lg">Dodaj lekcję</h3><StudentSelect />
          <div><Label>Termin</Label><Input name="when" type="datetime-local" required /></div>
          <div><Label>Czas (min)</Label><Input name="dur" type="number" defaultValue={60} min={15} /></div>
          <div><Label>Temat</Label><Input name="topic" /></div>
          <Button className="w-full">Dodaj</Button>
        </form>
      </TabsContent>

      <TabsContent value="students">
        <h2 className="mb-2 text-2xl">Uczniowie</h2>
        <p className="mb-4 text-sm text-muted-foreground">Uczniowie pojawiają się tu po założeniu konta na stronie logowania.</p>
        <div className="grid gap-3 md:grid-cols-2">{students.map((s) => {
          const next = lessons.find((l) => l.student_id === s.id && new Date(l.starts_at) > new Date());
          const open = homework.filter((h) => h.student_id === s.id && !h.grade).length;
          return (<div key={s.id} className="rounded-md border bg-card p-4"><div className="font-display text-lg">{s.full_name || "Bez imienia"}</div><div className="text-sm text-muted-foreground">{s.email}</div>
            <div className="mt-2 text-sm">Następna lekcja: {next ? fmt(next.starts_at) : "—"}</div><div className="text-sm">Zadania do oceny/otwarte: {open}</div></div>);
        })}</div>
      </TabsContent>

      <TabsContent value="materials" className="grid gap-8 md:grid-cols-[1fr_320px]">
        <section><h2 className="mb-4 text-2xl">Materiały</h2><ul className="space-y-2">{materials.map((m) => (
          <li key={m.id} className="flex items-start justify-between rounded-md border bg-card p-3"><div><div className="font-medium">{m.title}</div><div className="text-xs text-muted-foreground">{name(m.student_id)}</div>{m.description && <p className="mt-1 text-sm">{m.description}</p>}{m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Otwórz link</a>}</div>
          <Button variant="ghost" size="sm" onClick={() => matSave.mutate(() => supabase.from("materials").delete().eq("id", m.id))}>Usuń</Button></li>))}</ul></section>
        <form className="space-y-3 rounded-md border bg-card p-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const el = e.currentTarget;
          matSave.mutate(() => supabase.from("materials").insert({ student_id: String(f.get("student")) || null, title: String(f.get("title")), description: String(f.get("desc")) || null, url: String(f.get("url")) || null }), { onSuccess: () => el.reset() }); }}>
          <h3 className="text-lg">Dodaj materiał</h3><StudentSelect allowAll />
          <div><Label>Tytuł</Label><Input name="title" required /></div>
          <div><Label>Link</Label><Input name="url" type="url" placeholder="https://" /></div>
          <div><Label>Opis</Label><Textarea name="desc" /></div><Button className="w-full">Dodaj</Button>
        </form>
      </TabsContent>

      <TabsContent value="homework" className="grid gap-8 md:grid-cols-[1fr_320px]">
        <section><h2 className="mb-4 text-2xl">Zadania domowe</h2><ul className="space-y-3">{homework.map((h) => (
          <li key={h.id} className="rounded-md border bg-card p-4">
            <div className="flex justify-between"><div><div className="font-medium">{h.title}</div><div className="text-xs text-muted-foreground">{name(h.student_id)} · termin {h.due_date ?? "—"}</div></div>
              <Badge variant={h.grade ? "secondary" : h.submitted_at ? "default" : "outline"}>{h.grade ? `Ocena: ${h.grade}` : h.submitted_at ? "Oddane" : "Czeka"}</Badge></div>
            {h.submission && <p className="mt-2 whitespace-pre-wrap rounded bg-muted p-2 text-sm">{h.submission}</p>}
            {h.submitted_at && (
              <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget);
                hwSave.mutate(() => supabase.from("homework").update({ grade: String(f.get("grade")), feedback: String(f.get("fb")) }).eq("id", h.id)); }}>
                <Input name="grade" placeholder="Ocena" defaultValue={h.grade ?? ""} className="w-24" /><Input name="fb" placeholder="Komentarz" defaultValue={h.feedback ?? ""} className="flex-1" /><Button size="sm">Oceń</Button>
              </form>)}
          </li>))}</ul></section>
        <form className="space-y-3 rounded-md border bg-card p-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const el = e.currentTarget;
          hwSave.mutate(() => supabase.from("homework").insert({ student_id: String(f.get("student")), title: String(f.get("title")), description: String(f.get("desc")) || null, due_date: String(f.get("due")) || null }), { onSuccess: () => el.reset() }); }}>
          <h3 className="text-lg">Zadaj zadanie</h3><StudentSelect />
          <div><Label>Tytuł</Label><Input name="title" required /></div>
          <div><Label>Termin</Label><Input name="due" type="date" /></div>
          <div><Label>Polecenie</Label><Textarea name="desc" /></div><Button className="w-full">Zadaj</Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}

function StudentPanel({ userId }: { userId: string }) {
  const { lessons, materials, homework } = useData();
  const hwSave = useSave("homework");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const upcoming = lessons.filter((l) => new Date(l.starts_at) >= new Date());
  return (
    <div className="space-y-10">
      <section><h2 className="mb-4 text-2xl">Moje lekcje</h2>
        {upcoming.length === 0 ? <p className="text-muted-foreground">Brak zaplanowanych lekcji.</p> :
        <ul className="space-y-2">{upcoming.map((l) => <li key={l.id} className="rounded-md border bg-card p-3"><span className="font-medium">{fmt(l.starts_at)}</span> · {l.duration_min} min{l.topic && <span className="text-muted-foreground"> — {l.topic}</span>}</li>)}</ul>}
      </section>
      <section><h2 className="mb-4 text-2xl">Zadania domowe</h2>
        {homework.length === 0 && <p className="text-muted-foreground">Brak zadań.</p>}
        <ul className="space-y-3">{homework.map((h) => (
          <li key={h.id} className="rounded-md border bg-card p-4">
            <div className="flex justify-between"><div className="font-medium">{h.title}</div><span className="text-sm text-muted-foreground">termin {h.due_date ?? "—"}</span></div>
            {h.description && <p className="mt-1 whitespace-pre-wrap text-sm">{h.description}</p>}
            {h.grade && <p className="mt-2 rounded bg-secondary p-2 text-sm"><b>Ocena: {h.grade}</b>{h.feedback && ` — ${h.feedback}`}</p>}
            {!h.grade && (<div className="mt-3 space-y-2">
              <Textarea placeholder="Twoje rozwiązanie…" value={drafts[h.id] ?? h.submission ?? ""} onChange={(e) => setDrafts({ ...drafts, [h.id]: e.target.value })} />
              <Button size="sm" onClick={() => hwSave.mutate(() => supabase.from("homework").update({ submission: drafts[h.id] ?? h.submission ?? "", submitted_at: new Date().toISOString() }).eq("id", h.id).eq("student_id", userId))}>{h.submitted_at ? "Popraw rozwiązanie" : "Oddaj"}</Button>
            </div>)}
          </li>))}</ul>
      </section>
      <section><h2 className="mb-4 text-2xl">Materiały</h2>
        <ul className="grid gap-3 md:grid-cols-2">{materials.map((m) => <li key={m.id} className="rounded-md border bg-card p-4"><div className="font-medium">{m.title}</div>{m.description && <p className="mt-1 text-sm">{m.description}</p>}{m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Otwórz</a>}</li>)}</ul>
      </section>
    </div>
  );
}
