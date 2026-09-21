import { Form, useActionData, Link } from "react-router";
import { sql } from "../db.server";
import { useState, useEffect } from "react";

// INTENT: Smajlíci jsou definováni staticky na serveru.
// Zabraňuje to manipulaci z frontendové strany a umožňuje to snadné škálování designu.
const SMILEYS = [
  { rating: 1, id: "terrible", label: "Hrozně", color: "#e11d48", renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <ellipse cx="34" cy="38" rx="4.5" ry="5.5" fill="#e11d48" /><ellipse cx="66" cy="38" rx="4.5" ry="5.5" fill="#e11d48" />
        <path d="M 27 29 Q 35 33 41 31" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 73 29 Q 65 33 59 31" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="27" cy="47" r="5" fill="#fda4af" opacity="0.6" /><circle cx="73" cy="47" r="5" fill="#fda4af" opacity="0.6" />
        <path d="M 33 60 Q 50 46 67 60" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </svg>
  )},
  { rating: 2, id: "bad", label: "Špatně", color: "#f97316", renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="35" cy="38" r="4.5" fill="#f97316" /><circle cx="65" cy="38" r="4.5" fill="#f97316" />
        <circle cx="28" cy="47" r="5" fill="#fdba74" opacity="0.6" /><circle cx="72" cy="47" r="5" fill="#fdba74" opacity="0.6" />
        <path d="M 36 57 Q 50 49 64 57" stroke="#f97316" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </svg>
  )},
  { rating: 3, id: "okay", label: "Ujde to", color: "#eab308", renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="35" cy="38" r="5" fill="#ca8a04" /><circle cx="36.5" cy="36.5" r="1.5" fill="#ffffff" />
        <circle cx="65" cy="38" r="5" fill="#ca8a04" /><circle cx="66.5" cy="36.5" r="1.5" fill="#ffffff" />
        <circle cx="27" cy="46" r="5" fill="#fde047" opacity="0.7" /><circle cx="73" cy="46" r="5" fill="#fde047" opacity="0.7" />
        <line x1="38" y1="55" x2="62" y2="55" stroke="#ca8a04" strokeWidth="4.5" strokeLinecap="round" />
      </svg>
  )},
  { rating: 4, id: "good", label: "Dobře", color: "#84cc16", renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M 28 39 Q 36 30 44 39" stroke="#65a30d" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 56 39 Q 64 30 72 39" stroke="#65a30d" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="26" cy="46" r="5.5" fill="#bef264" opacity="0.8" /><circle cx="74" cy="46" r="5.5" fill="#bef264" opacity="0.8" />
        <path d="M 35 52 Q 50 63 65 52" stroke="#65a30d" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </svg>
  )},
  { rating: 5, id: "great", label: "Skvěle", color: "#10b981", renderFace: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M 27 38 Q 36 27 45 38" stroke="#059669" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M 55 38 Q 64 27 73 38" stroke="#059669" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <circle cx="24" cy="46" r="6" fill="#6ee7b7" opacity="0.8" /><circle cx="76" cy="46" r="6" fill="#6ee7b7" opacity="0.8" />
        <path d="M 32 49 Q 50 71 68 49 Z" fill="#059669" />
      </svg>
  )},
];

const SCHOOL_PERIODS = [
  { id: "0", name: "0. hodinu", startMin: 7 * 60 + 0, endMin: 7 * 60 + 57 },
  { id: "1", name: "1. hodinu", startMin: 7 * 60 + 58, endMin: 8 * 60 + 47 },
  { id: "2", name: "2. hodinu", startMin: 8 * 60 + 48, endMin: 9 * 60 + 45 },
  { id: "3", name: "3. hodinu", startMin: 9 * 60 + 46, endMin: 10 * 60 + 45 },
  { id: "4", name: "4. hodinu", startMin: 10 * 60 + 46, endMin: 11 * 60 + 37 },
  { id: "5", name: "5. hodinu", startMin: 11 * 60 + 38, endMin: 12 * 60 + 30 },
  { id: "6", name: "6. hodinu", startMin: 12 * 60 + 31, endMin: 13 * 60 + 22 },
  { id: "7", name: "7. hodinu", startMin: 13 * 60 + 23, endMin: 14 * 60 + 12 },
  { id: "8", name: "8. hodinu", startMin: 14 * 60 + 13, endMin: 15 * 60 + 10 },
];

// INTENT: Generuje unikátní klíč pro konkrétní den a hodinu. 
// Slouží pro zamykání formuláře, aby uživatel nemohl v jednom bloku hlasovat víckrát.
function getCurrentPeriodKey(): { key: string; name: string } {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const minutes = now.getHours() * 60 + now.getMinutes();

  const found = SCHOOL_PERIODS.find((p) => minutes >= p.startMin && minutes <= p.endMin);
  if (found) {
    return { key: `${dateStr}_period_${found.id}`, name: found.name };
  }
  return { key: `${dateStr}_hour_${now.getHours()}`, name: "tento vyučovací blok" };
}

export async function loader() {
  return null;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const rawRating = Number(formData.get("rating"));
  const rawMoodId = formData.get("moodId");

  // INTENT (SECURITY): Neověřená data z frontendu nikdy nevkládáme rovnou do SQL.
  // Zamezujeme SQL injection tím, že vstup konfrontujeme s předem definovaným polem SMILEYS.
  // Pokud odeslaná hodnota nesouhlasí s našimi daty (např. úprava v DevTools), požadavek je zamítnut.
  const validSmiley = SMILEYS.find(s => s.rating === rawRating && s.id === rawMoodId);

  if (validSmiley) {
    await sql(
      `INSERT INTO moods (mood_id, rating, label) VALUES ('${validSmiley.id}', ${validSmiley.rating}, '${validSmiley.label}')`
    );
  } else {
    throw new Error("Bezpečnostní blokace: Neplatná struktura dat.");
  }

  return { success: true };
}

// INTENT (TROUBLESHOOTING): Zachytává chyby při připojení k DB.
// Uživatel neuvidí pád aplikace, ale uživatelsky přívětivou obrazovku s možností restartu.
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-200 max-w-md">
        <div className="text-rose-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Chyba systému</h1>
        <p className="text-slate-500 text-sm">Něco se pokazilo, pravděpodobně došlo k výpadku databáze. Informujte vyučujícího.</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">
          Zkusit znovu
        </button>
      </div>
    </main>
  );
}

export default function Home() {
  const actionData = useActionData() as { success?: boolean } | undefined;
  const [hasVoted, setHasVoted] = useState(false);
  const [periodName, setPeriodName] = useState("");
  const [mounted, setMounted] = useState(false);

  // INTENT (UX & ANTI-SPAM): Hydration check a ověření stavu uzamčení.
  // Používáme localStorage pro zachování anonymity studentů (GDPR kompromis).
  useEffect(() => {
    setMounted(true);
    const { key, name } = getCurrentPeriodKey();
    setPeriodName(name);

    const votedPeriod = localStorage.getItem("mood_voted_period");
    if (votedPeriod === key) {
      setHasVoted(true);
    }
  }, []);

  useEffect(() => {
    if (actionData?.success) {
      const { key } = getCurrentPeriodKey();
      localStorage.setItem("mood_voted_period", key);
      setHasVoted(true);
    }
  }, [actionData]);

  // Pomocná funkce pro účely obhajoby a testování
  const handleResetForTesting = () => {
    localStorage.removeItem("mood_voted_period");
    setHasVoted(false);
    window.location.reload();
  };

  if (!mounted) return <main className="min-h-screen bg-slate-50" />;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none font-sans relative">
      {hasVoted ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-500 border-2 border-emerald-200 flex items-center justify-center text-5xl mb-6 shadow-sm">✨</div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Už jsi hlasoval(a)!</h2>
          <p className="text-slate-500 mt-3 text-sm leading-relaxed">
            Děkujeme za hodnocení pro <strong className="text-slate-700">{periodName}</strong>. Další hodnocení se automaticky odemkne po skončení další hodiny.
          </p>
          <button onClick={handleResetForTesting} className="mt-8 text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer">
            [Test: Resetovat zámek pro další hlas]
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tight">Jaká byla dnešní hodina?</h1>
            <p className="text-slate-500 text-base sm:text-lg mt-3 font-medium">Klepnutím na smajlíka ohodnoť proběhlou výuku</p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-4 sm:gap-6 md:gap-8 w-full">
            {SMILEYS.map((item) => (
              <Form method="post" key={item.rating} className="flex flex-col items-center">
                <input type="hidden" name="rating" value={item.rating} />
                <input type="hidden" name="moodId" value={item.id} />
                <input type="hidden" name="label" value={item.label} />
                <button
                  type="submit"
                  aria-label={item.label}
                  style={{ backgroundColor: item.color }}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full p-2 shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-2 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center group"
                >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-2 shadow-inner group-hover:bg-slate-50 transition-colors">
                    {item.renderFace()}
                  </div>
                </button>
                <span className="mt-3 text-xs sm:text-sm font-bold text-slate-600 group-hover:text-slate-900">{item.label}</span>
              </Form>
            ))}
          </div>
        </div>
      )}

      <Link to="/stats" title="Otevřít statistiky" className="fixed bottom-6 right-6 p-3 bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-slate-200/80 rounded-2xl shadow-sm transition active:scale-90 text-sm flex items-center gap-1.5 z-50">
        <span>📊</span><span className="text-xs font-semibold hidden sm:inline">Statistiky</span>
      </Link>

      {/* INTENT: Explicitní zmínka o GDPR minimalizaci dat přímo v UI */}
      <footer className="absolute bottom-4 left-0 right-0 px-6 text-center text-[10px] sm:text-xs text-slate-400 font-medium">
        <p>© 2026 SPŠ Trutnov | Projekt WAP</p>
        <p className="mt-0.5 opacity-80">
          Systém sbírá výhradně anonymní statistická data pro účely vylepšení výuky. Osobní údaje (GDPR) nejsou zpracovávány.<br className="hidden sm:block" /> 
          K zamezení spamu je využíváno lokální funkční úložiště zařízení.
        </p>
      </footer>
    </main>
  );
}