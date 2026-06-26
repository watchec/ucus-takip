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


  useEffect(() => {
    const q = query(collection(db, "flights"));

    const unsub = onSnapshot(
      q,
      (snap) => {

        const list: Flight[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Flight, "id">),
        }));

        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        setFlights(list);
        setLoading(false);
      },
      (err) => {
        console.error("SNAP ERR:", err);
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
      const ref = await addDoc(collection(db, "flights"), {
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
      console.error("ADD ERR:", err);
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold sm:text-5xl">
          Uçuş Takip <span className="text-cyan-400">Firestore</span>
        </h1>

        {error && <p className="mt-3 text-rose-400">Hata: {error}</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Toplam Uçuş" value={String(stats.total)} />
          <StatCard title="Boarding" value={String(stats.boarding)} accent="text-amber-400" />
          <StatCard title="Gecikmeli" value={String(stats.delayed)} accent="text-rose-400" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <form onSubmit={addFlight} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">Takip Ekle</h2>
            <div className="mt-4 space-y-3">
              <Input placeholder="Uçuş Kodu" value={form.code} onChange={(v) => setForm((p) => ({ ...p, code: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Nereden" value={form.from} onChange={(v) => setForm((p) => ({ ...p, from: v }))} />
                <Input placeholder="Nereye" value={form.to} onChange={(v) => setForm((p) => ({ ...p, to: v }))} />
              </div>
              <Input type="time" value={form.time} onChange={(v) => setForm((p) => ({ ...p, time: v }))} />
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as FlightStatus }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option>On Time</option>
                <option>Boarding</option>
                <option>Delayed</option>
              </select>
            </div>
            <button type="submit" className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950">
              Uçuşu Ekle
            </button>
          </form>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
            <h2 className="text-xl font-semibold">Uçuşlar</h2>
            {loading ? (
              <p className="mt-4 text-slate-400">Yükleniyor...</p>
            ) : filteredFlights.length === 0 ? (
              <p className="mt-4 text-slate-400">Kayıt bulunamadı.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredFlights.map((f) => (
                  <div key={f.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-lg font-bold">{f.code}</p>
                    <p className="text-sm text-slate-400">{f.from} → {f.to} • {f.time}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => setFlightStatus(f.id, "On Time")} className="rounded-lg border px-3 py-1 text-xs">On Time</button>
                      <button onClick={() => setFlightStatus(f.id, "Boarding")} className="rounded-lg border px-3 py-1 text-xs">Boarding</button>
                      <button onClick={() => setFlightStatus(f.id, "Delayed")} className="rounded-lg border px-3 py-1 text-xs">Delayed</button>
                      <button onClick={() => removeFlight(f.id)} className="ml-auto rounded-lg border px-3 py-1 text-xs">Sil</button>
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

function StatCard({ title, value, accent }: { title: string; value: string; accent?: string }) {
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
      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
    />
  );
}