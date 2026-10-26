import { ChevronRight, ShieldCheck, Thermometer } from 'lucide-react';

import { ICA_CONFIG } from '../config/ica';
import { DecisionBadge, PriorityBadge } from './StatusComponents';

/* ============================================================
   MATRIZ — SOMENTE RODEIROS CRÍTICOS
   ============================================================ */

function ProblemMatrix({ wheelsets, onSelectWheel }) {
  const critical = wheelsets.filter((wheel) => wheel.priority === 'critico');

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#151716]">
      <div className="border-b border-white/[0.07] p-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-red-400">Monitoramento de rodeiros</p>
        <h3 className="mt-1 text-xl font-bold text-white">Rodeiros críticos</h3>
        <p className="mt-1 text-xs text-slate-500">
          Exibindo somente rodeiros classificados como <strong className="text-red-300">críticos</strong> (ICA abaixo de {ICA_CONFIG.critica}). Os demais podem ser consultados na frota, abaixo.
        </p>
      </div>

      {critical.length === 0 ? (
        <div className="p-12 text-center">
          <ShieldCheck size={30} className="mx-auto text-vale-teal/40" />
          <p className="mt-4 text-sm font-semibold text-slate-300">Nenhum rodeiro crítico</p>
          <p className="mt-1 text-xs text-slate-600">Os demais rodeiros podem ser consultados no desenho da frota abaixo.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-black/10">
                {['Vagão', 'Posição', 'Identificação', 'ICA', 'Prioridade', 'Decisão', 'KM', 'Friso', 'Acústico', 'Impacto', 'Hot Box', 'Ocorrências'].map((h) => (
                  <th key={h} className="px-5 py-4 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{h}</span>
                  </th>
                ))}
                <th />
              </tr>
            </thead>

            <tbody>
              {critical.map((wheel) => (
                <tr
                  key={wheel.identificacao}
                  onClick={() => onSelectWheel(wheel)}
                  className="group cursor-pointer border-b border-white/[0.045] transition hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <span className="font-bold text-white">{wheel.vagao}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-slate-300">{wheel.posicao}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] text-slate-500">{wheel.identificacao}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-base font-bold text-red-300">{wheel.ica}</span>
                  </td>
                  <td className="px-5 py-4">
                    <PriorityBadge priority={wheel.priority} />
                  </td>
                  <td className="px-5 py-4">
                    <DecisionBadge type={wheel.decision.type} label={wheel.decision.label} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-300">{wheel.km.toLocaleString('pt-BR')} km</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-300">{wheel.friso.toFixed(2)} mm</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-300">{wheel.acustico || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-semibold ${
                        wheel.impacto >= ICA_CONFIG.impactoCritico
                          ? 'text-red-300'
                          : wheel.impacto >= ICA_CONFIG.impactoAtencao
                          ? 'text-vale-gold'
                          : 'text-slate-400'
                      }`}
                    >
                      {wheel.impacto ? `${wheel.impacto} kN` : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {wheel.hotBox ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-[9px] font-bold text-red-300">
                        <Thermometer size={11} />
                        SIM
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">NÃO</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {wheel.problems.map((problem) => (
                        <span key={problem} className="rounded-md bg-red-500/10 px-2 py-1 text-[8px] font-bold text-red-300">
                          {problem}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <ChevronRight size={15} className="text-slate-700 transition group-hover:translate-x-1 group-hover:text-white" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   DESENHO DO RODEIRO
   ============================================================ */

function WheelStatus({ wheel }) {
  const config = {
    critico: { border: 'border-red-500/50', bg: 'bg-red-500/10', color: 'text-red-400' },
    medio: { border: 'border-vale-gold/50', bg: 'bg-vale-gold/10', color: 'text-vale-gold' },
    baixo: { border: 'border-slate-600', bg: 'bg-slate-700/20', color: 'text-slate-500' },
  };

  const style = config[wheel.priority];

  return (
    <div className="relative flex flex-col items-center">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${style.border} ${style.bg}`}>
        <div className={`h-3 w-3 rounded-full bg-current ${style.color}`} />
      </div>
      <span className="mt-2 text-[9px] font-bold text-slate-400">{wheel.posicao}</span>
      <span className={`mt-1 text-[8px] font-bold ${style.color}`}>ICA {wheel.ica}</span>
    </div>
  );
}

/* ============================================================
   DESENHO DO VAGÃO — módulo ferroviário clicável
   ============================================================ */

function WagonDrawing({ wagon, onClick }) {
  const priorityStyle = {
    critico: {
      border: 'border-red-400/50',
      body: 'bg-red-500/[0.12]',
      accent: 'bg-red-400',
      text: 'text-red-300',
      label: 'Crítico',
    },
    medio: {
      border: 'border-vale-gold/50',
      body: 'bg-vale-gold/[0.1]',
      accent: 'bg-vale-gold',
      text: 'text-vale-gold',
      label: 'Requer avaliação',
    },
    baixo: {
      border: 'border-vale-teal/35',
      body: 'bg-vale-teal/[0.08]',
      accent: 'bg-vale-teal',
      text: 'text-vale-teal',
      label: 'Normal',
    },
  };

  const style = priorityStyle[wagon.priority];

  return (
    <button
      type="button"
      onClick={() => onClick(wagon)}
      aria-label={`Abrir detalhes do vagão ${wagon.vagao}, estado ${style.label}`}
      className="group relative flex w-56 shrink-0 flex-col items-center pt-2 text-left outline-none"
    >
      <span className="absolute -left-2.5 top-[6.25rem] h-2 w-5 rounded-full bg-slate-600 ring-2 ring-[#151716] transition group-hover:bg-slate-400" />

      <div
        className={`relative w-full rounded-lg border-2 ${style.border} ${style.body} p-3 shadow-lg transition duration-200 group-hover:-translate-y-1 group-hover:shadow-2xl`}
      >
        <div className={`absolute inset-x-3 top-0 h-1 rounded-b-full ${style.accent}`} />
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500">Vagão</p>
            <p className="mt-1 text-base font-bold text-white">{wagon.vagao}</p>
          </div>
          <span className={`rounded-md border border-current/20 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wider ${style.text}`}>
            {style.label}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1">
          <span className="h-5 w-1 rounded-full bg-white/10" />
          <span className="h-7 flex-1 rounded border border-white/10 bg-black/20" />
          <span className="h-5 w-1 rounded-full bg-white/10" />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
          <span className="text-[8px] uppercase tracking-wider text-slate-500">Pior ICA</span>
          <span className={`text-xs font-bold ${style.text}`}>{wagon.worstICA}</span>
        </div>
      </div>

      <div className="relative mt-2 flex w-[86%] justify-between px-3">
        <span className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-700" />
        {wagon.rodas.map((wheel) => (
          <span
            key={wheel.identificacao}
            className={`relative z-10 h-5 w-5 rounded-full border-4 border-[#151716] ${
              wheel.priority === 'critico'
                ? 'bg-red-400'
                : wheel.priority === 'medio'
                ? 'bg-vale-gold'
                : 'bg-vale-teal'
            } shadow-[0_2px_0_1px_rgba(0,0,0,0.5)]`}
            title={`${wheel.posicao}: ICA ${wheel.ica}`}
          />
        ))}
      </div>

      <span className="mt-2 text-[8px] font-semibold uppercase tracking-wider text-slate-600 transition group-hover:text-slate-300">
        {wagon.problemCount > 0 ? `${wagon.problemCount} com ocorrência` : 'Sem ocorrência'}
      </span>
    </button>
  );
}


export { ProblemMatrix, WagonDrawing, WheelStatus };
