"use client";

import { useEffect, useMemo, useState } from "react";

type FlightStatus = "On Time" | "Delayed" | "Boarding";

type Flight = {
  id: number;
  code: string;
  from: string;
  to: string;
  time: string;
  status: FlightStatus;
};

const seedFlights: Flight[] = [
  { id: 1, code: "TK2419", from: "IST", to: "ESB", time: "09:30", status: "On Time" },
  { id: 2, code: "PC1012", from: "SAW", to: "AYT", time: "10:15", status: "Boarding" },
  { id: 3, code: "AJ455", from: "ADB", to: "DLM", time: "11:05", status: "Delayed" },
];

const STORAGE_KEY = "ucus-takip-flights-v2";

export default function Home() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | FlightStatus>("All");

  const [form, setForm] = useState({
    code: "",
    from: "",
    to: "",
    time: "",
    status: "On Time" as FlightStatus,
  });

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setFlights(JSON.parse(raw) as Flight[]);
      } else {
        setFlights(seedFlights);
      }
    } catch {
      setFlights(seedFlights);
    }
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
  }, [flights]);

  const filteredFlights = useMemo(() => {
    return flights.filter((f) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        f.code.toLowerCase().includes(q) ||
        f.from.toLowerCase().includes(q) ||
        f.to.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" ? true : f.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [flights, query, statusFilter]);

  const stats = useMemo(() => {
    const total = flights.length;
    const delayed = flights.filter((f) => f.status === "Delayed").length;
    const boarding = flights.filter((f) => f.status === "Boarding").length;
    return { total, delayed, boarding };
  }, [flights]);

  const addFlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.from || !form.to || !form.time) {
      alert("Lütfen tüm alanları doldur.");
      return;
    }

    const newFlight: Flight = {
      id: Date.now(),
      code: form.code.trim().toUpperCase(),
      from: form.from.trim().toUpperCase(),
      to: form.to.trim().toUpperCase(),
      time: form.time,
      status: form.status,
    };

    setFlights((prev) => [newFlight, ...prev]);
    setForm({ code: "", from: "", to: "", time: "", status: "On Time" });
  };

  const deleteFlight = (id: number) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
  };

  const updateStatus = (id: number, next: FlightStatus) => {
    setFlights((prev) => prev.map((f) => (f.id === id ? { ...f, status: next } : f)));
  };

  const clearAll = () => {
    if (!confirm("Tüm uçuşları silmek istediğine emin misin?")) return;
    setFlights([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(flights, null, 2)], { type: "application/json" });
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
            Uçuş Takip <span className="text-cyan-400">Dashboard</span>
          </h1>

          <div className="flex gap-2">
            <button
              onClick={exportJSON}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              JSON Export
            </button>
            <button
              onClick={clearAll}
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20"
            >
              Tümünü Temizle
            </button>
          </div>
        </div>

        <p className="mt-3 text-slate-300">
          Uçuş ekle, ara, filtrele, durum güncelle. Veriler tarayıcıda saklanır.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Toplam Uçuş" value={stats.total.toString()} />
          <StatCard title="Boarding" value={stats.boarding.toString()} accent="text-amber-400" />
          <StatCard title="Gecikmeli" value={stats.delayed.toString()} accent="text-rose-400" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Form */}
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
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as FlightStatus }))
                }
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

          {/* List + filters */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
            <h2 className="text-xl font-semibold">Uçuşlar</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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

            {filteredFlights.length === 0 ? (
              <p className="mt-4 text-slate-400">Sonuç yok.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredFlights.map((flight) => (
                  <div
                    key={flight.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-bold">{flight.code}</p>
                        <p className="text-sm text-slate-400">
                          {flight.from} → {flight.to} • {flight.time}
                        </p>
                      </div>
                      <StatusBadge status={flight.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">Durum değiştir:</span>
                      <button
                        onClick={() => updateStatus(flight.id, "On Time")}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
                      >
                        On Time
                      </button>
                      <button
                        onClick={() => updateStatus(flight.id, "Boarding")}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
                      >
                        Boarding
                      </button>
                      <button
                        onClick={() => updateStatus(flight.id, "Delayed")}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-300"
                      >
                        Delayed
                      </button>

                      <button
                        onClick={() => deleteFlight(flight.id)}
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