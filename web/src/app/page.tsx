"use client";

import { useMemo, useState } from "react";

type FlightStatus = "On Time" | "Delayed" | "Boarding";

type Flight = {
  id: number;
  code: string;
  from: string;
  to: string;
  time: string;
  status: FlightStatus;
};

const initialFlights: Flight[] = [
  { id: 1, code: "TK2419", from: "IST", to: "ESB", time: "09:30", status: "On Time" },
  { id: 2, code: "PC1012", from: "SAW", to: "AYT", time: "10:15", status: "Boarding" },
  { id: 3, code: "AJ455", from: "ADB", to: "DLM", time: "11:05", status: "Delayed" },
];

export default function Home() {
  const [flights, setFlights] = useState<Flight[]>(initialFlights);
  const [form, setForm] = useState({
    code: "",
    from: "",
    to: "",
    time: "",
    status: "On Time" as FlightStatus,
  });

  const stats = useMemo(() => {
    const total = flights.length;
    const delayed = flights.filter((f) => f.status === "Delayed").length;
    const boarding = flights.filter((f) => f.status === "Boarding").length;
    return { total, delayed, boarding };
  }, [flights]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.from || !form.to || !form.time) return;

    const newFlight: Flight = {
      id: Date.now(),
      code: form.code.toUpperCase(),
      from: form.from.toUpperCase(),
      to: form.to.toUpperCase(),
      time: form.time,
      status: form.status,
    };

    setFlights((prev) => [newFlight, ...prev]);
    setForm({ code: "", from: "", to: "", time: "", status: "On Time" });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold sm:text-5xl">
          Uçuş Takip <span className="text-cyan-400">Dashboard</span>
        </h1>
        <p className="mt-3 text-slate-300">
          Uçuş ekle, durumları takip et, gecikmeleri anında gör.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Toplam Uçuş" value={stats.total.toString()} />
          <StatCard title="Boarding" value={stats.boarding.toString()} accent="text-amber-400" />
          <StatCard title="Gecikmeli" value={stats.delayed.toString()} accent="text-rose-400" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={onSubmit}
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

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
            <h2 className="text-xl font-semibold">Uçuşlar</h2>
            <div className="mt-4 space-y-3">
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-lg font-bold">{flight.code}</p>
                    <p className="text-sm text-slate-400">
                      {flight.from} → {flight.to} • {flight.time}
                    </p>
                  </div>
                  <StatusBadge status={flight.status} />
                </div>
              ))}
            </div>
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
