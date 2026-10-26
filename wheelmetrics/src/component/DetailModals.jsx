import { Activity, Gauge, GaugeCircle, Radio, Ruler, Thermometer, X } from 'lucide-react';

import { DecisionBadge, PriorityBadge } from './StatusComponents';
import { WheelStatus } from './FleetComponents';

/* ============================================================
   MODAL DO RODEIRO
   ============================================================ */

function WheelModal({ wheel, onClose }) {
  if (!wheel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#171918] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/[0.07] p-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-red-400">Detalhamento do rodeiro</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Vagão {wheel.vagao}</h2>
              <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-slate-300">{wheel.posicao}</span>
              <PriorityBadge priority={wheel.priority} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              ID técnico: <span className="text-slate-300">{wheel.identificacao}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-3 border-b border-white/[0.07] p-6 sm:grid-cols-3">
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">ICA do rodeiro</p>
            <p
              className={`mt-1 text-3xl font-bold ${
                wheel.priority === 'critico' ? 'text-red-300' : wheel.priority === 'medio' ? 'text-vale-gold' : 'text-vale-teal'
              }`}
            >
              {wheel.ica}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Prioridade</p>
            <div className="mt-2">
              <PriorityBadge priority={wheel.priority} />
            </div>
          </div>
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Decisão</p>
            <div className="mt-2">
              <DecisionBadge type={wheel.decision.type} label={wheel.decision.label} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem icon={GaugeCircle} label="KM rodado" value={`${wheel.km.toLocaleString('pt-BR')} km`} />
          <DetailItem icon={Ruler} label="Friso" value={`${wheel.friso.toFixed(2)} mm`} />
          <DetailItem icon={Radio} label="Acústico" value={wheel.acustico || 'Sem registro'} />
          <DetailItem icon={Gauge} label="Condição KM" value={`${wheel.kmCondition}`} />
          <DetailItem icon={Ruler} label="Condição Friso" value={`${wheel.frisoCondition}`} />
          <DetailItem icon={Activity} label="Condição Acústico" value={`${wheel.acousticCondition}`} />
          <DetailItem icon={Activity} label="Impacto" value={wheel.impacto ? `${wheel.impacto} kN` : 'Sem registro'} />
          <DetailItem icon={Activity} label="Condição Impacto" value={`${wheel.impactCondition}`} />
          <DetailItem icon={Thermometer} label="Hot Box" value={wheel.hotBox ? 'SIM' : 'NÃO'} danger={wheel.hotBox} />
        </div>

        <div className="border-t border-white/[0.07] p-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">Problemas identificados</p>
          {wheel.problems.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {wheel.problems.map((problem) => (
                <span key={problem} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-bold text-red-300">
                  {problem}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-vale-teal">Nenhuma ocorrência.</p>
          )}
        </div>

        <div className="flex justify-end border-t border-white/[0.07] bg-black/10 px-6 py-4">
          <DecisionBadge type={wheel.decision.type} label={wheel.decision.label} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, danger = false }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
      <div className="flex items-center gap-2">
        <Icon size={14} className={danger ? 'text-red-400' : 'text-slate-600'} />
        <span className="text-[9px] uppercase tracking-wider text-slate-600">{label}</span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${danger ? 'text-red-300' : 'text-slate-200'}`}>{value}</p>
    </div>
  );
}

/* ============================================================
   MODAL DO VAGÃO — mostra os 4 rodeiros e a situação de cada um
   ============================================================ */

function WagonModal({ wagon, onClose }) {
  if (!wagon) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#171918] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/[0.07] p-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-vale-teal">Detalhamento da frota</p>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Vagão {wagon.vagao}</h2>
              <PriorityBadge priority={wagon.priority} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Visão completa dos quatro rodeiros.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:bg-white/5 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-3 border-b border-white/[0.07] p-6 sm:grid-cols-3">
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Pior ICA</p>
            <p className="mt-1 text-2xl font-bold text-white">{wagon.worstICA}</p>
          </div>
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Rodeiros com ocorrência</p>
            <p className="mt-1 text-2xl font-bold text-red-300">
              {wagon.problemCount}/{wagon.rodas.length}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Decisão sugerida</p>
            <div className="mt-2">
              <DecisionBadge type={wagon.decision.type} label={wagon.decision.label} />
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Os 4 rodeiros do vagão</p>

          <div className="grid gap-3 md:grid-cols-4">
            {wagon.rodas.map((wheel) => (
              <div
                key={wheel.identificacao}
                className={`rounded-2xl border p-4 ${
                  wheel.priority === 'critico'
                    ? 'border-red-500/20 bg-red-500/[0.05]'
                    : wheel.priority === 'medio'
                    ? 'border-vale-gold/20 bg-vale-gold/[0.05]'
                    : 'border-white/[0.07] bg-black/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{wheel.posicao}</span>
                  <PriorityBadge priority={wheel.priority} />
                </div>

                <div className="mt-5 flex justify-center">
                  <WheelStatus wheel={wheel} />
                </div>

                <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">ICA</span>
                    <span className="text-xs font-bold text-white">{wheel.ica}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">KM</span>
                    <span className="text-xs text-slate-300">{wheel.km.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">Friso</span>
                    <span className="text-xs text-slate-300">{wheel.friso.toFixed(2)} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">Acústico</span>
                    <span className="text-xs text-slate-300">{wheel.acustico}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">HotBox</span>
                    <span className="text-xs text-slate-300">{wheel.hotBox}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">Impacto</span>
                    <span className="text-xs text-slate-300">{wheel.impacto}</span>
                  </div>
                </div>

                {wheel.problems.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {wheel.problems.map((problem) => (
                      <span key={problem} className="rounded-md bg-red-500/10 px-2 py-1 text-[8px] font-semibold text-red-300">
                        {problem}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-white/[0.07] bg-black/10 px-6 py-4">
          <DecisionBadge type={wagon.decision.type} label={wagon.decision.label} />
        </div>
      </div>
    </div>
  );
}


export { WagonModal, WheelModal };
