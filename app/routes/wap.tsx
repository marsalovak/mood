import { useLoaderData, Link } from "react-router";
import { sql } from "../db.server";
import { useState } from "react";

// INTENT: Studenti WAP hodnotí výuku až po skončení dvouhodinovky.
// Rozdělování na jednotlivé hodiny by vedlo ke zkresleným nebo prázdným grafům v půlce bloku.
// Záměrem této funkce je proto logické sdružení časů (středa 5.+6. = jeden blok).
function getWapBlockInfo(d: Date): { isWap: boolean; blockLabel: string; dateStr: string } | null {
  const day = d.getDay();
  const mins = d.getHours() * 60 + d.getMinutes();
  const dateStr = d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });

  if (day === 3 && mins >= 11 * 60 + 35 && mins <= 13 * 60 + 30) {
    return { isWap: true, blockLabel: "Středa (5.–6. hodina)", dateStr };
  }
  if (day === 1 && mins >= 8 * 60 + 45 && mins <= 10 * 60 + 50) {
    return { isWap: true, blockLabel: "Pondělí (2.–3. hodina)", dateStr };
  }
  return { isWap: false, blockLabel: "Ostatní", dateStr };
}

// INTENT: Automatické škálování odpovědí.
// Záměrem je ušetřit vyučujícímu čas se studováním čísel a poskytnout mu okamžitý "zdravotní stav" třídy.
function getMoodFeedback(avg: number, count: number) {
  if (count === 0) return { title: "Zatím žádná hodnocení z WAPu", description: "Počkejte, až studenti po skončení dvouhodinovky odhlasují.", color: "text-slate-700 bg-slate-100 border-slate-200" };
  if (avg >= 4.3) return { title: "Vaši studenti jsou nadšení a hodina je bavila! ✨", description: "Většina třídy hodnotí výuku na výbornou.", color: "text-emerald-800 bg-emerald-50 border-emerald-200" };
  if (avg >= 3.7) return { title: "Studenti jsou spokojení 👍", description: "Dvouhodinovka proběhla dobře.", color: "text-teal-800 bg-teal-50 border-teal-200" };
  if (avg >= 3.0) return { title: "Studenti to hodnotí jako „ujde to / v pohodě“ 😐", description: "Průměrné hodnocení kolem středu.", color: "text-amber-800 bg-amber-50 border-amber-200" };
  if (avg >= 2.2) return { title: "Spíše unavené až vlažné reakce 🙁", description: "Studenti hodnotí hodinu hůře. Možná náročnější látka.", color: "text-orange-800 bg-orange-50 border-orange-200" };
  return { title: "Studenti se cítí přetížení nebo nespokojení ⚠️", description: "Pravděpodobně došlo k zádrhelu v zadání.", color: "text-rose-800 bg-rose-50 border-rose-200" };
}

export async function loader() {
  const rows = await sql("SELECT rating, created_at FROM moods ORDER BY created_at ASC");
  const data = Array.isArray(rows) ? rows : [];

  const all = data
    .map((r: any) => {
      const val = Number(r.rating);
      if (isNaN(val) || val < 1 || val > 5) return null;
      const d = r.created_at ? new Date(r.created_at) : new Date();
      const info = getWapBlockInfo(d);
      return { rating: val, isWap: info?.isWap || false, dateStr: info?.dateStr || "", blockLabel: info?.blockLabel || "" };
    })
    .filter(Boolean);

  return { entries: all };
}

// INTENT: Fallback pro administraci. Kdyby nastal jakýkoliv error v SQL nebo datech, aplikace nezhavaruje.
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-200 max-w-md">
        <div className="text-rose-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Chyba načítání dat</h1>
        <p className="text-slate-500 text-sm">Při načítání dat pro dashboard došlo k výpadku. Zkontrolujte připojení k databázi.</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">Obnovit stránku</button>
      </div>
    </main>
  );
}

export default function WapDashboard() {
  const { entries } = useLoaderData() as {
    entries: Array<{ rating: number; isWap: boolean; dateStr: string; blockLabel: string }>;
  };
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const wapEntries = entries.filter((e) => e.isWap);
  const otherEntries = entries.filter((e) => !e.isWap);

  // INTENT (Výkon): Výpočet probíhá na klientovi. S ohledem na rozsah databáze
  // je to paměťově zcela dostačující a snižujeme tak zátěž databázového serveru.
  const wapRatings = wapEntries.map((e) => e.rating);
  const count = wapRatings.length;
  const avg = count > 0 ? Number((wapRatings.reduce((a, b) => a + b, 0) / count).toFixed(2)) : 0;

  const otherRatings = otherEntries.map((e) => e.rating);
  const otherAvg = otherRatings.length > 0 ? Number((otherRatings.reduce((a, b) => a + b, 0) / otherRatings.length).toFixed(2)) : 0;

  const feedback = getMoodFeedback(avg, count);

  const historyMap: Record<string, { ratings: number[]; date: string; label: string }> = {};
  wapEntries.forEach((e) => {
    const key = `${e.dateStr}_${e.blockLabel}`;
    if (!historyMap[key]) {
      historyMap[key] = { ratings: [], date: e.dateStr, label: e.blockLabel };
    }
    historyMap[key].ratings.push(e.rating);
  });

  const historyBars = Object.values(historyMap).map((h) => {
    const barAvg = Number((h.ratings.reduce((a, b) => a + b, 0) / h.ratings.length).toFixed(2));
    return { date: h.date, label: h.label, avg: barAvg, count: h.ratings.length };
  });

  const trend = historyBars.length >= 2
    ? Number((historyBars[historyBars.length - 1].avg - historyBars[historyBars.length - 2].avg).toFixed(2))
    : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl space-y-8 flex-1">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍💻</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">WAP: Portál vyučujícího</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">Webové aplikace (4.IT, vyučující: mam) – blokové hodnocení</p>
          </div>
          <Link to="/stats" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-semibold shadow-sm transition active:scale-95 flex items-center gap-2">
            <span>←</span> Zpět na celkový přehled
          </Link>
        </div>

        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${feedback.color}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider block opacity-75">Automatické shrnutí spokojenosti</span>
            {trend !== null && (
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${trend > 0 ? "bg-emerald-100/90 text-emerald-800 border-emerald-300" : trend < 0 ? "bg-rose-100/90 text-rose-800 border-rose-300" : "bg-slate-100 text-slate-700 border-slate-300"}`}>
                {trend > 0 ? `▲ Oproti minulé dvouhodinovce +${trend}` : trend < 0 ? `▼ Oproti minulé dvouhodinovce ${trend}` : "● Beze změny"}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">{feedback.title}</h2>
          <p className="mt-2 text-sm sm:text-base opacity-90 leading-relaxed max-w-2xl">{feedback.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-bold">
            <div className="bg-white/85 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xs border border-current/10">Celkový průměr WAP: <span className="text-lg font-black">{count > 0 ? avg : "—"}</span> / 5.0</div>
            <div className="bg-white/85 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xs border border-current/10">Celkem hlasů: <span className="text-lg font-black">{count}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-indigo-500/30 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Předmět WAP</span>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">dvouhodinovky</span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl font-black text-indigo-600">{count > 0 ? avg : "—"}</span><span className="text-slate-400 text-sm font-semibold">/ 5.0</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">průměr z vašich odučených bloků</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ostatní výuka na učebně</span>
              <span className="text-xs font-medium text-slate-400">referenční průměr</span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl font-black text-slate-700">{otherRatings.length > 0 ? otherAvg : "—"}</span><span className="text-slate-400 text-sm font-semibold">/ 5.0</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">průměr napříč ostatními hodinami</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 leading-none">Vývoj spokojenosti na dvouhodinovkách WAP</h3>
                <span className="inline-flex items-center leading-none text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full whitespace-nowrap">blokový přehled</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Souhrnné hodnocení za celý blok výuky</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" /><span>&gt; 4.0 Super</span></span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" /><span>3.0–3.9 V pohodě</span></span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" /><span>&lt; 3.0 Varování</span></span>
            </div>
          </div>

          {historyBars.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">Zatím nebyla zaznamenána žádná hodnocení.</div>
          ) : (
            <div className="relative pt-4">
              <div className="absolute inset-x-0 top-4 bottom-16 flex flex-col justify-between pointer-events-none">
                {[5, 4, 3, 2, 1].map((val) => (
                  <div key={val} className="flex items-center gap-2 w-full">
                    <span className="text-[10px] font-bold text-slate-400 w-5 text-right font-mono">{val}.0</span>
                    <div className="flex-1 border-b border-dashed border-slate-200" />
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-8 sm:gap-14 h-64 pl-8 pr-2 overflow-x-auto relative z-10 pb-16">
                {historyBars.map((bar, idx) => {
                  const heightPercent = Math.max(12, Math.round(((bar.avg - 1) / 4) * 88 + 12));
                  const barColor = bar.avg >= 4.0 ? "bg-emerald-500 hover:bg-emerald-600" : bar.avg >= 3.0 ? "bg-amber-400 hover:bg-amber-500" : "bg-rose-500 hover:bg-rose-600";
                  const isHovered = hoveredIdx === idx;
                  return (
                    <div key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)} className="flex-1 min-w-[100px] max-w-[130px] flex flex-col items-center h-full justify-end relative cursor-pointer group">
                      {isHovered && (
                        <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[11px] font-semibold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap animate-in fade-in zoom-in duration-150">
                          <span>{bar.avg} / 5.0</span><span className="text-slate-400 ml-1.5">({bar.count} hlasů celkem)</span>
                        </div>
                      )}
                      <span className="text-xs font-black text-slate-800 mb-2 group-hover:scale-110 transition">{bar.avg}</span>
                      <div className="w-full bg-slate-100 h-44 rounded-2xl flex items-end p-2 border border-slate-200/60 shadow-inner">
                        <div className={`w-full rounded-xl transition-all duration-500 shadow-sm ${barColor}`} style={{ height: `${heightPercent}%` }} />
                      </div>
                      <div className="absolute -bottom-14 flex flex-col items-center text-center w-full">
                        <span className="text-xs font-extrabold text-slate-800 truncate w-full">{bar.date}</span>
                        <span className="text-[10px] font-semibold text-slate-500 truncate w-full">{bar.label}</span>
                        <span className="text-[9px] font-bold text-indigo-500 mt-0.5">{bar.count} {bar.count === 1 ? "hlas" : bar.count >= 2 && bar.count <= 4 ? "hlasy" : "hlasů"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <footer className="w-full max-w-4xl text-center text-[10px] sm:text-xs text-slate-400 font-medium mt-12 pb-4">
        <p>© 2026 SPŠ Trutnov | Projekt WAP</p>
        <p className="mt-0.5 opacity-80">Systém sbírá výhradně anonymní statistická data pro účely vylepšení výuky. Osobní údaje (GDPR) nejsou zpracovávány.<br className="hidden sm:block" /> K zamezení spamu je využíváno lokální funkční úložiště zařízení.</p>
      </footer>
    </main>
  );
}