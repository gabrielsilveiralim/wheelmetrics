import { ClipboardCheck, ClipboardPlus, Wrench } from 'lucide-react';

/* ============================================================
   BADGES  — paleta Vale: verde-petróleo (#00807C) e amarelo-ouro
   (#EEA722). Vermelho fica reservado só para "crítico" — é
   convenção de segurança, não cor de marca.
   ============================================================ */

function PriorityBadge({ priority }) {
  const config = {
    critico: { label: 'CRÍTICO', classes: 'border-red-500/20 bg-red-500/10 text-red-300' },
    medio: { label: 'MÉDIO', classes: 'border-vale-gold/20 bg-vale-gold/10 text-vale-gold' },
    baixo: { label: 'BAIXO', classes: 'border-vale-teal/20 bg-vale-teal/10 text-vale-teal' },
  };

  const item = config[priority];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] ${item.classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {item.label}
    </span>
  );
}

function DecisionBadge({ type, label }) {
  const config = {
    nota: { icon: ClipboardPlus, classes: 'bg-red-500/10 text-red-300 border-red-500/20' },
    avaliar: { icon: Wrench, classes: 'bg-vale-gold/10 text-vale-gold border-vale-gold/20' },
    normal: { icon: ClipboardCheck, classes: 'bg-vale-teal/10 text-vale-teal border-vale-teal/20' },
  };

  const item = config[type];
  const Icon = item.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-semibold ${item.classes}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

/* ============================================================
   KPI
   ============================================================ */

function KPI({ icon: Icon, label, value, danger = false, warning = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${ 'border border-dashed border-white/10 bg-black/10 p-4 transition hover:border-vale-teal/30 hover:bg-vale-teal/[0.03]'
      }`}
    >
      <div className="flex items-end justify-end">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger ? 'text-red-700' : warning ? 'text-vale-gold' : 'text-vale-teal'
          }`}>
          <Icon size={19} />
        </div>
      </div>
      <p className={`mt-5 text-3xl font-bold ${
       danger ? 'text-red-800' : warning ? 'text-yellow-500' : 'text-white'
       }`}>
       {value}</p>
      <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">{label}</p>
    </div>
  );
}


export { DecisionBadge, KPI, PriorityBadge };
