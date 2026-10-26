import { useCallback, useMemo, useState } from 'react';
import { processWorkbook, readWorkbook } from '../services/workbook';
import {
  KPI,
  ProblemMatrix,
  WagonDrawing,
  WagonModal,
  WheelModal,
} from './AnalysisComponents';

import {
  UploadCloud,
  FileSpreadsheet,
  Gauge,
  TrainFront,
  Activity,
  RotateCcw,
  CheckCircle2,
  ClipboardPlus,
  ClipboardCheck,
  Wrench,
  CircleAlert,
  Search,
} from 'lucide-react';

import '../index.css';

/* ============================================================
   PÁGINA
   ============================================================ */

export default function WheelMetrics() {
  const [data, setData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedWagon, setSelectedWagon] = useState(null);
  const [selectedWheel, setSelectedWheel] = useState(null);
  const [search, setSearch] = useState('');

  const handleFile = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = readWorkbook(e.target.result);
        const processed = processWorkbook(workbook);
        setData(processed);
        setSelectedWagon(null);
        setSelectedWheel(null);
      } catch (err) {
        console.error(err);
        setData(null);
        setError(err?.message || 'Não foi possível processar o arquivo.');
      } finally {
        setLoading(false);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setLoading(false);
      setError('Erro ao ler o arquivo.');
      event.target.value = '';
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const reset = () => {
    setData(null);
    setFileName('');
    setError('');
    setSelectedWagon(null);
    setSelectedWheel(null);
    setSearch('');
  };

  const stats = useMemo(() => {
    if (!data) return { vagoes: 0, rodas: 0, abrirNota: 0, avaliar: 0, normal: 0 };

    const { wagons, wheelsets } = data;

    return {
      vagoes: wagons.length,
      rodas: wheelsets.length,
      abrirNota: wheelsets.filter((w) => w.decision.type === 'nota').length,
      avaliar: wheelsets.filter((w) => w.decision.type === 'avaliar').length,
      normal: wheelsets.filter((w) => w.decision.type === 'normal').length,
    };
  }, [data]);

  const filteredWagons = useMemo(() => {
    if (!data) return [];
    return data.wagons.filter((wagon) => !search || wagon.vagao.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  return (
    <div className="min-h-screen bg-[#101211] text-white">
      

      <main className="mx-auto max-w-7xl px-6 py-7">
        {/* HERO + UPLOAD */}
        <section className="relative overflow-hidden mt-28 mb-10">
          <div className="bg-vale-teal/[0.06]" />

          <div className="relative grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7 lg:p-10 mt-8">

              <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                Transforme dados de manutenção em
                <span className="text-vale-teal"> decisão operacional.</span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-400">
                Analise o Índice de Condição do Ativo de cada rodeiro, identifique ocorrências e
                apoie a decisão sobre abertura de nota de manutenção.
              </p>

              <div className="mt-7 grid max-w-xl grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">ICA</p>
                  <p className="mt-1 text-xs font-bold text-white">Condição</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">Rodeiro</p>
                  <p className="mt-1 text-xs font-bold text-white">Individual</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">Decisão</p>
                  <p className="mt-1 text-xs font-bold text-white">Manutenção</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/[0.07] p-6 lg:border-l lg:border-t-0 lg:p-8">
              <label className="group flex h-full min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center transition hover:border-vale-teal/30 hover:bg-vale-teal/[0.03]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-vale-teal/10 text-vale-teal">
                  {loading ? <Activity size={27} className="animate-pulse" /> : <UploadCloud size={27} />}
                </div>

                <h3 className="mt-5 text-base font-bold text-white">
                  {loading ? 'Processando documento...' : 'Carregar base de manutenção'}
                </h3>

                <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                  Utilize um arquivo contendo as abas
                  <strong className="text-slate-300"> Friso, Alarmes e KM_Rodado</strong>.
                </p>

                <span className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  <FileSpreadsheet size={14} />
                  Selecionar arquivo
                </span>

                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFile} />
              </label>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4">
            <CircleAlert size={18} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-300">Não foi possível processar o documento</p>
              <p className="mt-1 text-xs text-red-300/60">{error}</p>
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-vale-teal/10 bg-vale-teal/[0.04] px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-vale-teal" />
                <span className="text-xs text-slate-400">Base processada:</span>
                <span className="text-xs font-semibold text-white">{fileName}</span>
              </div>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-white"
              >
                <RotateCcw size={12} />
                Nova análise
              </button>
            </div>

            {/* KPIs */}
            <section className="mt-7">
              <div className="mb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-vale-teal">Indicadores essenciais</p>
                <h3 className="mt-1 text-lg font-bold text-white">Visão geral da análise</h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <KPI icon={TrainFront} label="Vagões analisados" value={stats.vagoes} description="frota processada" />
                <KPI icon={Gauge} label="Rodeiros analisados" value={stats.rodas} description="rodeiros processados" />
                <KPI icon={ClipboardPlus} label="Sugestão de abrir nota" value={stats.abrirNota} description="rodeiros prioritários" danger={stats.abrirNota > 0} />
                <KPI icon={Wrench} label="Programar / avaliar" value={stats.avaliar} description="rodeiros em avaliação" warning={stats.avaliar > 0} />
                <KPI icon={ClipboardCheck} label="Não abrir agora" value={stats.normal} description="rodeiros em acompanhamento" />
              </div>
            </section>

            {/* MATRIZ — SÓ CRÍTICOS */}
            <section className="mt-8">
              <ProblemMatrix wheelsets={data.wheelsets} onSelectWheel={setSelectedWheel} />
            </section>

            {/* FROTA COMPLETA — clique abre o card com os 4 rodeiros */}
            <section className="mt-8">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-vale-teal">Visão física da frota</p>
                  <h3 className="mt-1 text-lg font-bold text-white">Trem e seus vagões</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Todos os vagões da base. Clique em um deles para ver a situação de cada um dos 4 rodeiros.
                  </p>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar vagão..."
                    className="w-full rounded-xl border border-white/10 bg-[#181a19] py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-700 focus:border-vale-teal/30 md:w-52"
                  />
                </div>
              </div>

              <div className="mb-5 overflow-x-auto rounded-3xl border border-white/[0.07] bg-[#151716] p-6">
                {filteredWagons.length === 0 ? (
                  <div className="flex min-h-52 min-w-[22rem] flex-col items-center justify-center text-center">
                    <Search size={24} className="text-slate-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-300">Nenhum vagão encontrado</p>
                    <p className="mt-1 text-xs text-slate-600">Ajuste o termo de busca para visualizar a composição.</p>
                  </div>
                ) : (
                  <div className="flex min-w-max items-end justify-start gap-0 pb-2">
                    <div className="relative mr-2 flex w-36 shrink-0 flex-col items-center justify-end">
                      <div className="flex h-28 w-full items-center justify-center rounded-l-2xl rounded-r-md border-2 border-vale-teal/40 bg-vale-teal/[0.12] shadow-lg">
                        <TrainFront size={44} className="text-vale-teal" />
                      </div>
                      <div className="mt-2 flex w-[78%] justify-between px-2">
                        <span className="h-5 w-5 rounded-full border-4 border-[#151716] bg-vale-teal shadow-[0_2px_0_1px_rgba(0,0,0,0.5)]" />
                        <span className="h-5 w-5 rounded-full border-4 border-[#151716] bg-vale-teal shadow-[0_2px_0_1px_rgba(0,0,0,0.5)]" />
                      </div>
                      <span className="mt-2 text-[8px] font-bold uppercase tracking-[0.18em] text-vale-teal">Locomotiva</span>
                    </div>

                    {filteredWagons.map((wagon) => (
                      <WagonDrawing key={wagon.vagao} wagon={wagon} onClick={setSelectedWagon} />
                    ))}
                  </div>
                )}
              </div>
            </section>

          </>
        )}
      </main>

      <WheelModal wheel={selectedWheel} onClose={() => setSelectedWheel(null)} />
      <WagonModal wagon={selectedWagon} onClose={() => setSelectedWagon(null)} />

      <footer className="mx-auto max-w-7xl px-6 pb-7 pt-6">
        <div className="border-t border-white/[0.05] pt-5 text-[9px] uppercase tracking-wider text-slate-700">
          WheelMetrics • Apoio à decisão de manutenção ferroviária
        </div>
      </footer>
    </div>
  );
}