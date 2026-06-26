"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

type FlightStatus = "On Time" | "Delayed" | "Boarding";

type Flight = {
  id: string;
  code: string;
  from: string;
  to: string;
  time: string;
  status: FlightStatus;
  createdAt?: number;
};

export default function Home() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [queryText, setQueryText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | FlightStatus>("All");

  const [form, setForm] = useState({
    code: "",
    from: "",
    to: "",
    time: "",
    status: "On Time" as FlightStatus,
  });

  // Firestore realtime subscribe (orderBy yok -> index takılması olmaz)
  useEffect(() => {
    const q = query(collection(db, "flights"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Flight[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Flight, "id">),
        }));

        // client-side sort (createdAt varsa yeni üstte)
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        setFlights(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore read error:", err);
        setError(err?.message || "Firestore okuma hatası");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filteredFlights = useMemo(() => {
    return flights.filter((f) => {
      const q = queryText.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        f.code.toLowerCase().includes(q) ||
        f.from.toLowerCase().includes(q) ||
        f.to.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" ? true : f.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [flights, queryText, statusFilter]);

  const stats = useMemo(() => {
    const total = flights.length;
    const boarding = flights.filter((f) => f.status === "Boarding").length;
    const delayed = flights.filter((f) => f.status === "Delayed").length;
    return { total, boarding, delayed };
  }, [flights]);

  const addFlight = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code || !form.from || !form.to || !form.time) {
      alert("Lütfen tüm alanları doldur.");
      return;
    }

    try {
      await addDoc(collection(db, "flights"), {
        code: form.code.trim().toUpperCase(),
        from: form.from.trim().toUpperCase(),
        to: form.to.trim().toUpperCase(),
        time: form.time,
        status: form.status,
        createdAt: Date.now(),
      });

      setForm({
        code: "",
        from: "",
        to: "",
        time: "",
        status: "On Time",
      });
    } catch (err) {
      console.error(err);
      alert("Uçuş eklenemedi.");
    }
  };

  const removeFlight = async (id: string) => {
    try {
      await deleteDoc(doc(db, "flights", id));
    } catch (err) {
      console.error(err);
      alert("Uçuş silinemedi.");
    }
  };

  const setFlightStatus = async (id: string, status: FlightStatus) => {
    try {
      await updateDoc(doc(db, "flights", id), { status });
    } catch (err) {
      console.error(err);
      alert("Durum güncellenemedi.");
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(flights, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flights.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold sm:text-5xl">
            Uçuş Takip <span className="text-cyan-400">Firestore</span>
          </h1>

          <button
            onClick={exportJSON}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
          >
            JSON Export
          </button>
        </div>

        <p className="mt-3 text-slate-300">
          Veriler Firebase Firestore’da tutulur (cihazlar arası senkron).
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Toplam Uçuş" value={String(stats.total)} />
          <StatCard title="Boarding" value={String(stats.boarding)} accent="text-amber-400" />
          <StatCard title="Gecikmeli" value={String(stats.delayed)} accent="text-rose-400" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={addFlight}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-1"
          >
            <h2 className="text-xl font-semibold">Takip Ekle</h2>

            <div className="mt-4 space-y-3">
              <Input
                placeholder="Uçuş Kodu (TK1234)"
                value={form.code}
                onChange={(v) => setForm((p) => ({ ...p, code: v }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Nereden (IST)"
                  value={form.from}
                  onChange={(v) => setForm((p) => ({ ...p, from: v }))}
                />
                <Input
                  placeholder="Nereye (ESB)"
                  value={form.to}
                  onChange={(v) => setForm((p) => ({ ...p, to: v }))}
                />
              </div>

              <Input
                type="time"
                value={form.time}
                onChange={(v) => setForm((p) => ({ ...p, time: v }))}
              />

              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as FlightStatus }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
              >
                <option>On Time</option>
                <option>Boarding</option>
                <option>Delayed</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Uçuşu Ekle
            </button>
          </form>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
            <h2 className="text-xl font-semibold">Uçuşlar</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ara: TK, IST, ESB..."
                className="sm:col-span-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | FlightStatus)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
              >
                <option value="All">Tüm Durumlar</option>
                <option value="On Time">On Time</option>
                <option value="Boarding">Boarding</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            {error ? (
              <p className="mt-4 text-rose-400">Hata: {error}</p>
            ) : loading ? (
              <p className="mt-4 text-slate-400">Yükleniyor...</p>
            ) : filteredFlights.length === 0 ? (
              <p className="mt-4 text-slate-400">Kayıt bulunamadı.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredFlights.map((f) => (
                  <div
                    key={f.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-bold">{f.code}</p>
                        <p className="text-sm text-slate-400">
                          {f.from} → {f.to} • {f.time}
                        </p>
                      </div>
                      <StatusBadge status={f.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">Durum:</span>

                      <button
                        onClick={() => setFlightStatus(f.id, "On Time")}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
                      >
                        On Time
                      </button>
                      <button
                        onClick={() => setFlightStatus(f.id, "Boarding")}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
                      >
                        Boarding
                      </button>
                      <button
                        onClick={() => setFlightStatus(f.id, "Delayed")}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-300"
                      >
                        Delayed
                      </button>

                      <button
                        onClick={() => removeFlight(f.id)}
                        className="ml-auto rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
    />
  );
}

function StatusBadge({ status }: { status: FlightStatus }) {
  const cls =
    status === "On Time"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status === "Boarding"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-rose-500/15 text-rose-300 border-rose-500/30";

  return <span className={`rounded-full border px-3 py-1 text-sm font-medium ${cls}`}>{status}</span>;
}