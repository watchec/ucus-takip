export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <div className="inline-flex w-fit items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
          Uçuş Takip Sistemi
        </div>

        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          Uçuşlarını tek panelden
          <span className="block text-cyan-400">takip et, yönet, raporla.</span>
        </h1>

        <p className="max-w-2xl text-lg text-slate-300">
          Uçuş numarası, rota, saat ve durum bilgilerini tek yerden yönetebileceğin
          modern bir takip ekranı.
        </p>

        <div className="flex flex-wrap gap-4">
          <button className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            Takip Ekle
          </button>
          <button className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-800">
            Dashboard
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Toplam Uçuş</p>
            <p className="mt-2 text-3xl font-bold">128</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Aktif Takip</p>
            <p className="mt-2 text-3xl font-bold text-cyan-400">24</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Gecikmeli</p>
            <p className="mt-2 text-3xl font-bold text-rose-400">3</p>
          </div>
        </div>
      </section>
    </main>
  );
}
