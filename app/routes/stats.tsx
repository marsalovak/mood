import { useLoaderData, Link, useSearchParams } from "react-router";
import { sql } from "../db.server";

const SMILEY_INFO: Record<
  number,
  { label: string; barColor: string; textColor: string; renderFace: () => JSX.Element }
> = {
  5: {
    label: "Skvěle",
    barColor: "bg-emerald-400",
    textColor: "text-emerald-600",
    renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#ecfdf5" stroke="#10b981" strokeWidth="4" />
        <path d="M 27 38 Q 36 27 45 38" stroke="#059669" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M 55 38 Q 64 27 73 38" stroke="#059669" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <circle cx="24" cy="46" r="6" fill="#6ee7b7" opacity="0.8" />
        <circle cx="76" cy="46" r="6" fill="#6ee7b7" opacity="0.8" />
        <path d="M 32 49 Q 50 71 68 49 Z" fill="#059669" />
      </svg>
    ),
  },
  4: {
    label: "Dobře",
    barColor: "bg-lime-400",
    textColor: "text-lime-600",
    renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#f7fee7" stroke="#84cc16" strokeWidth="4" />
        <path d="M 28 39 Q 36 30 44 39" stroke="#65a30d" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 56 39 Q 64 30 72 39" stroke="#65a30d" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="26" cy="46" r="5.5" fill="#bef264" opacity="0.8" />
        <circle cx="74" cy="46" r="5.5" fill="#bef264" opacity="0.8" />
        <path d="M 35 52 Q 50 63 65 52" stroke="#65a30d" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  3: {
    label: "Ujde to",
    barColor: "bg-amber-400",
    textColor: "text-amber-600",
    renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#fefce8" stroke="#eab308" strokeWidth="4" />
        <circle cx="35" cy="38" r="5" fill="#ca8a04" />
        <circle cx="36.5" cy="36.5" r="1.5" fill="#ffffff" />
        <circle cx="65" cy="38" r="5" fill="#ca8a04" />
        <circle cx="66.5" cy="36.5" r="1.5" fill="#ffffff" />
        <circle cx="27" cy="46" r="5" fill="#fde047" opacity="0.7" />
        <circle cx="73" cy="46" r="5" fill="#fde047" opacity="0.7" />
        <line x1="38" y1="55" x2="62" y2="55" stroke="#ca8a04" strokeWidth="4.5" strokeLinecap="round" />
      </svg>
    ),
  },
  2: {
    label: "Špatně",
    barColor: "bg-orange-400",
    textColor: "text-orange-600",
    renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#fff7ed" stroke="#f97316" strokeWidth="4" />
        <circle cx="35" cy="38" r="4.5" fill="#f97316" />
        <circle cx="65" cy="38" r="4.5" fill="#f97316" />
        <circle cx="28" cy="47" r="5" fill="#fdba74" opacity="0.6" />
        <circle cx="72" cy="47" r="5" fill="#fdba74" opacity="0.6" />
        <path d="M 36 57 Q 50 49 64 57" stroke="#f97316" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  1: {
    label: "Hrozně",
    barColor: "bg-rose-400",
    textColor: "text-rose-600",
    renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#fff1f2" stroke="#e11d48" strokeWidth="4" />
        <ellipse cx="34" cy="38" rx="4.5" ry="5.5" fill="#e11d48" />
        <ellipse cx="66" cy="38" rx="4.5" ry="5.5" fill="#e11d48" />
        <path d="M 27 29 Q 35 33 41 31" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 73 29 Q 65 33 59 31" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="27" cy="47" r="5" fill="#fda4af" opacity="0.6" />
        <circle cx="73" cy="47" r="5" fill="#fda4af" opacity="0.6" />
        <path d="M 33 60 Q 50 46 67 60" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
};

const SCHOOL_PERIODS = [
  { id: "0", name: "0. hodina", time: "7:10 – 7:55", endStr: "7:55", startMin: 7 * 60 + 0, endMin: 7 * 60 + 57 },
  { id: "1", name: "1. hodina", time: "8:00 – 8:45", endStr: "8:45", startMin: 7 * 60 + 58, endMin: 8 * 60 + 47 },
  { id: "2", name: "2. hodina", time: "8:50 – 9:35", endStr: "9:35", startMin: 8 * 60 + 48, endMin: 9 * 60 + 45 },
  { id: "3", name: "3. hodina", time: "9:55 – 10:40", endStr: "10:40", startMin: 9 * 60 + 46, endMin: 10 * 60 + 45 },
  { id: "4", name: "4. hodina", time: "10:50 – 11:35", endStr: "11:35", startMin: 10 * 60 + 46, endMin: 11 * 60 + 37 },
  { id: "5", name: "5. hodina", time: "11:40 – 12:25", endStr: "12:25", startMin: 11 * 60 + 38, endMin: 12 * 60 + 30 },
  { id: "6", name: "6. hodina", time: "12:35 – 13:20", endStr: "13:20", startMin: 12 * 60 + 31, endMin: 13 * 60 + 22 },
  { id: "7", name: "7. hodina", time: "13:25 – 14:10", endStr: "14:10", startMin: 13 * 60 + 23, endMin: 14 * 60 + 12 },
  { id: "8", name: "8. hodina", time: "14:15 – 15:00", endStr: "15:00", startMin: 14 * 60 + 13, endMin: 15 * 60 + 10 },
];

function assignPeriod(createdAt: string | null) {
  if (!createdAt) return { periodId: "other", periodTitle: "Mimo výuku" };
  const d = new Date(createdAt);
  const minutes = d.getHours() * 60 + d.getMinutes();

  const found = SCHOOL_PERIODS.find((p) => minutes >= p.startMin && minutes <= p.endMin);
  if (found) {
    return { periodId: found.id, periodTitle: `${found.name} (konec ${found.endStr})` };
  }
  return { periodId: "other", periodTitle: "Ostatní časy" };
}

export async function loader() {
  const rows = await sql("SELECT rating, created_at FROM moods ORDER BY created_at DESC");
  const data = Array.isArray(rows) ? rows : [];

  const enriched = data
    .map((r: any) => {
      const val = Number(r.rating);
      if (isNaN(val) || val < 1 || val > 5) return null;
      return {
        rating: val,
        created_at: r.created_at,
        ...assignPeriod(r.created_at),
      };
    })
    .filter(Boolean);

  return { entries: enriched };
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-200 max-w-md">
        <div className="text-rose-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Chyba načítání dat</h1>
        <p className="text-slate-500 text-sm">Při načítání statistik došlo k výpadku. Zkontrolujte připojení k databázi.</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">
          Obnovit stránku
        </button>
      </div>
    </main>
  );
}

export default function StatsPage() {
  const { entries } = useLoaderData() as {
    entries: Array<{ rating: number; created_at: string; periodId: string; periodTitle: string }>;
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const filterPeriod = searchParams.get("period") || "ALL";

  const filtered = filterPeriod === "ALL" ? entries : entries.filter((e) => e.periodId === filterPeriod);

  const ratings = filtered.map((e) => e.rating);
  const count = ratings.length;

  const sum = ratings.reduce((acc, val) => acc + val, 0);
  const average = count > 0 ? Number((sum / count).toFixed(2)) : 0;

  const histogram: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => {
    histogram[r] = (histogram[r] || 0) + 1;
  });

  const sorted = [...ratings].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = count === 0 ? 0 : count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  let maxFreq = 0;
  Object.values(histogram).forEach((freq) => {
    if (freq > maxFreq) maxFreq = freq;
  });
  const mode = Object.entries(histogram)
    .filter(([_, freq]) => freq === maxFreq && maxFreq > 0)
    .map(([val]) => Number(val));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl space-y-8 flex-1">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Statistiky spokojenosti</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">Zvonění SPŠ Trutnov (L1 – L4)</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/wap"
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-2"
            >
              <span>👨‍💻</span> Jen WAP (učitel)
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-semibold shadow-sm transition active:scale-95 flex items-center gap-2"
            >
              <span>←</span> Hlasování
            </Link>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">L4: Časový filtr</span>
            <p className="text-slate-600 text-sm font-medium">
              {filterPeriod === "ALL" ? "Zobrazeny všechny hodiny souhrnně" : "Filtrováno podle zvolené hodiny"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterPeriod}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value === "ALL") next.delete("period");
                else next.set("period", e.target.value);
                setSearchParams(next);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-2xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
            >
              <option value="ALL">Všechny hodiny souhrnně</option>
              {SCHOOL_PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.time})
                </option>
              ))}
              <option value="other">Ostatní časy</option>
            </select>
            {filterPeriod !== "ALL" && (
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("period");
                  setSearchParams(next);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-600 transition"
              >
                Zrušit filtr ✕
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Celkem hlasů</span>
            <p className="text-3xl font-black text-slate-900 mt-2">{count}</p>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded-full">L1</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Průměr</span>
            <div className="flex items-baseline gap-1 mt-2">
              <p className="text-3xl font-black text-emerald-600">{average}</p>
              <span className="text-sm font-medium text-slate-400">/ 5</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded-full">L1</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Medián</span>
            <p className="text-3xl font-black text-sky-600 mt-2">{median}</p>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded-full">L2</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Modus</span>
            <p className="text-3xl font-black text-amber-500 mt-2">{mode.length > 0 ? mode.join(", ") : "—"}</p>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded-full">L2</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900">Histogram rozložení nálad (L2)</h2>
            <span className="text-xs font-semibold text-slate-400">souhrn četností</span>
          </div>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((val) => {
              const info = SMILEY_INFO[val];
              const votes = histogram[val] || 0;
              const percentage = count > 0 ? Math.round((votes / count) * 100) : 0;
              return (
                <div key={val} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 flex-shrink-0">{info.renderFace()}</div>
                  <span className={`w-20 font-bold ${info.textColor}`}>{info.label}</span>
                  <div className="flex-1 bg-slate-100 h-4 rounded-full overflow-hidden p-0.5">
                    <div className={`h-full rounded-full ${info.barColor} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-slate-800">{votes}×</span>
                  <span className="w-12 text-right text-xs text-slate-400 font-semibold">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-900">Hodnocení podle konců hodin na učebně (L3)</h2>
            <p className="text-slate-500 text-xs mt-1">Jednotlivé bloky vyučování podle školního rozvrhu zvonění (kliknutím kartu vyfiltruješ)</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SCHOOL_PERIODS.map((p) => {
              const periodVotes = entries.filter((e) => e.periodId === p.id);
              const pCount = periodVotes.length;
              const pAvg = pCount > 0 ? (periodVotes.reduce((acc, v) => acc + v.rating, 0) / pCount).toFixed(2) : "—";
              const isSelected = filterPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    if (isSelected) next.delete("period");
                    else next.set("period", p.id);
                    setSearchParams(next);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 shadow-sm" : pCount > 0 ? "bg-white border-slate-200 hover:border-slate-300 shadow-sm" : "bg-slate-50 border-slate-200/60 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    <span className="text-[11px] font-semibold text-slate-400">konec {p.endStr}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{p.time}</div>
                  <div className="flex items-baseline justify-between mt-3">
                    <div>
                      <span className="text-2xl font-black text-slate-900">{pAvg}</span>
                      {pCount > 0 && <span className="text-xs text-slate-400 font-medium ml-1">/ 5</span>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${pCount > 0 ? "bg-slate-100 text-slate-700" : "bg-transparent text-slate-300"}`}>
                      {pCount} {pCount === 1 ? "hlas" : pCount >= 2 && pCount <= 4 ? "hlasy" : "hlasů"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="w-full max-w-4xl text-center text-[10px] sm:text-xs text-slate-400 font-medium mt-12 pb-4">
        <p>© 2026 SPŠ Trutnov | Projekt WAP</p>
        <p className="mt-0.5 opacity-80">
          Systém sbírá výhradně anonymní statistická data pro účely vylepšení výuky. Osobní údaje (GDPR) nejsou zpracovávány.<br className="hidden sm:block" /> 
          K zamezení spamu je využíváno lokální funkční úložiště zařízení.
        </p>
      </footer>
    </main>
  );
}