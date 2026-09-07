import { useState } from "react";

// Těchto 5 nálad budeme sledovat
const MOODS = [
  {
    id: "great",
    label: "Skvěle",
    emoji: "😄",
    color: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    id: "good",
    label: "Dobře",
    emoji: "🙂",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    id: "okay",
    label: "Ujde to",
    emoji: "😐",
    color: "bg-amber-500 hover:bg-amber-600",
  },
  {
    id: "bad",
    label: "Špatně",
    emoji: "🙁",
    color: "bg-orange-500 hover:bg-orange-600",
  },
  {
    id: "terrible",
    label: "Hrozně",
    emoji: "😢",
    color: "bg-rose-500 hover:bg-rose-600",
  },
];

export default function Home() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleSelectMood = (moodLabel: string) => {
    setSelectedMood(moodLabel);
    // Tady později přidáme odesílání do databáze!
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Mood Tracker</h1>
        <p className="text-slate-400 mb-8 text-sm">
          Jak se dnes cítíš? Vyber jednu z nálad:
        </p>

        {/* 5 tlačítek na nálady */}
        <div className="grid grid-cols-1 gap-3">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleSelectMood(mood.label)}
              className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-all transform active:scale-95 shadow-md ${mood.color}`}>
              <span className="text-2xl">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>

        {/* Potvrzení výběru */}
        {selectedMood && (
          <div className="mt-6 p-4 rounded-xl bg-slate-700/60 border border-slate-600 animate-fade-in">
            <p className="text-sm text-slate-300">
              Vybraná nálada:{" "}
              <span className="font-semibold text-white">{selectedMood}</span>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
