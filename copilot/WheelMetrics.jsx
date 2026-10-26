import { useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, Gauge, TrainFront, AlertTriangle, TriangleAlert, ShieldCheck, Activity, X, RotateCcw, CheckCircle2, ClipboardPlus, ClipboardCheck, Wrench, CircleAlert, Search, ChevronRight, Thermometer, Ruler, GaugeCircle, Radio } from "lucide-react";
import "../index.css";

// CONFIGURAÇÃO DO ICA

const ICA_CONFIG = {
  kmAtencao: 250000,
  kmCritico: 300000,

  frisoMax: 24.1,
  frisoMin: 22.1,

  impactoAtencao: 220,
  impactoCritico: 250,

  critica: 40,
  media: 70,

  pesoKm: 0.25,
  pesoFriso: 0.3,
  pesoAcustico: 0.15,
  pesoImpacto: 0.15,
  pesoHotBox: 0.15,
};

const OPERACIONAL = {
  backlog: 22000,
  surgimento: 630,
  troca: 596,
};

// HELPERS

const normalizeHeader = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const findColumn = (headers, patterns) => {
  const normalized = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  for (const pattern of patterns) {
    const match = normalized.find((item) =>
      item.normalized.includes(normalizeHeader(pattern)),
    );
    if (match) return match.original;
  }
  return null;
};

const parseNumber = (value) => {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return 0;

  let text = String(value)
    .trim()
    .replace(/[^\d,.-]/g, "");

  if (text.includes(".") && text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(".") && /\.\d{3}$/.test(text)) {
    text = text.replace(/\./g, "");
  } else {
    text = text.replace(",", ".");
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
};

const normalizeValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isYes = (value) =>
  ["sim", "yes", "true", "1", "s", "x"].includes(normalizeValue(value));

// ICA — CONDIÇÃO DO RODEIRO

const calculateKmCondition = (km) => {
  if (km <= ICA_CONFIG.kmAtencao) return 100;
  if (km >= ICA_CONFIG.kmCritico) return 0;
  const range = ICA_CONFIG.kmCritico - ICA_CONFIG.kmAtencao;
  return 100 - ((km - ICA_CONFIG.kmAtencao) / range) * 100;
};

const calculateFrisoCondition = (friso) => {
  if (friso <= ICA_CONFIG.frisoMin) return 0;
  if (friso >= ICA_CONFIG.frisoMax) return 100;
  const range = ICA_CONFIG.frisoMax - ICA_CONFIG.frisoMin;
  return ((friso - ICA_CONFIG.frisoMin) / range) * 100;
};

const calculateAcousticCondition = (acustico) => {
  const value = Number(acustico) || 0;
  if (value <= 1) return 100;
  if (value >= 6) return 0;
  return 100 - ((value - 1) / 5) * 100;
};

const calculateImpactCondition = (impacto) => {
  const value = Number(impacto) || 0;
  if (value < ICA_CONFIG.impactoAtencao) return 100;
  if (value >= ICA_CONFIG.impactoCritico) return 0;
  return (
    100 -
    ((value - ICA_CONFIG.impactoAtencao) /
      (ICA_CONFIG.impactoCritico - ICA_CONFIG.impactoAtencao)) *
      100
  );
};

const calculateHotBoxCondition = (hotBox) => (hotBox ? 0 : 100);

// CLASSIFICAÇÃO

const classifyICA = (ica) => {
  if (ica < ICA_CONFIG.critica) return "critico";
  if (ica < ICA_CONFIG.media) return "medio";
  return "baixo";
};

const getDecision = (ica) => {
  if (ica < 40) return { label: "Abrir nota", type: "nota" };
  if (ica < 60) return { label: "Programar / avaliar", type: "avaliar" };
  return { label: "Não abrir agora", type: "normal" };
};

// PROBLEMAS

const getProblemTypes = ({ acustico, impacto, hotBox, friso, km }) => {
  const problems = [];
  if (hotBox) problems.push("Hot Box");

  if (Number(impacto) >= ICA_CONFIG.impactoCritico) {
    problems.push("Impacto crítico");
  } else if (Number(impacto) >= ICA_CONFIG.impactoAtencao) {
    problems.push("Impacto");
  }

  if (Number(acustico) >= 4) problems.push(`Acústico nível ${acustico}`);
  if (friso <= ICA_CONFIG.frisoMin) problems.push("Friso");

  if (km >= ICA_CONFIG.kmCritico) {
    problems.push("Quilometragem");
  } else if (km >= ICA_CONFIG.kmAtencao) {
    problems.push("Quilometragem em atenção");
  }

  return problems;
};

// PROCESSAMENTO DAS 3 ABAS

const processWorkbook = (workbook) => {
  const requiredSheets = ["Friso", "Alarmes", "KM_Rodado"];
  const missingSheets = requiredSheets.filter(
    (sheet) => !workbook.SheetNames.includes(sheet),
  );

  if (missingSheets.length) {
    throw new Error(
      `A planilha precisa possuir as abas: Friso, Alarmes e KM_Rodado. Faltando: ${missingSheets.join(", ")}.`,
    );
  }

  const readSheet = (sheetName) =>
    XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

  const frisoRows = readSheet("Friso");
  const alarmRows = readSheet("Alarmes");
  const kmRows = readSheet("KM_Rodado");

  if (!frisoRows.length) throw new Error("A aba Friso está vazia.");
  if (!alarmRows.length) throw new Error("A aba Alarmes está vazia.");
  if (!kmRows.length) throw new Error("A aba KM_Rodado está vazia.");

  const frisoHeaders = Object.keys(frisoRows[0]);
  const alarmHeaders = Object.keys(alarmRows[0]);
  const kmHeaders = Object.keys(kmRows[0]);

  const frisoCols = {
    vagao: findColumn(frisoHeaders, ["vagao", "wagon"]),
    posicao: findColumn(frisoHeaders, ["posicao", "rodeiro"]),
    identificacao: findColumn(frisoHeaders, [
      "identificacao_tecnica",
      "identificacao",
    ]),
    friso: findColumn(frisoHeaders, ["friso_mm", "friso"]),
  };

  const alarmCols = {
    vagao: findColumn(alarmHeaders, ["vagao"]),
    posicao: findColumn(alarmHeaders, ["posicao", "rodeiro"]),
    identificacao: findColumn(alarmHeaders, [
      "identificacao_tecnica",
      "identificacao",
    ]),
    acustico: findColumn(alarmHeaders, ["acustico"]),
    impacto: findColumn(alarmHeaders, ["impacto"]),
    hotBox: findColumn(alarmHeaders, ["hotbox", "hot_box"]),
  };

  const kmCols = {
    vagao: findColumn(kmHeaders, ["vagao"]),
    posicao: findColumn(kmHeaders, ["posicao", "rodeiro"]),
    identificacao: findColumn(kmHeaders, [
      "identificacao_tecnica",
      "identificacao",
    ]),
    km: findColumn(kmHeaders, ["km_rodado", "quilometragem", "km"]),
  };

  const validateColumns = (columns, sheetName) => {
    const required = Object.entries(columns)
      .filter(
        ([key]) =>
          !(
            sheetName === "Alarmes" &&
            ["acustico", "impacto", "hotBox"].includes(key)
          ),
      )
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (required.length) {
      throw new Error(
        `Não foi possível identificar as colunas ${required.join(", ")} na aba ${sheetName}.`,
      );
    }
  };

  validateColumns(frisoCols, "Friso");
  validateColumns(alarmCols, "Alarmes");
  validateColumns(kmCols, "KM_Rodado");

  const alarmMap = new Map();
  alarmRows.forEach((row) => {
    const key =
      row[alarmCols.identificacao] ||
      `${row[alarmCols.vagao]}_${row[alarmCols.posicao]}`;
    alarmMap.set(String(key), {
      acustico: parseNumber(row[alarmCols.acustico]),
      impacto: parseNumber(row[alarmCols.impacto]),
      hotBox: isYes(row[alarmCols.hotBox]),
    });
  });

  const kmMap = new Map();
  kmRows.forEach((row) => {
    const key =
      row[kmCols.identificacao] ||
      `${row[kmCols.vagao]}_${row[kmCols.posicao]}`;
    kmMap.set(String(key), parseNumber(row[kmCols.km]));
  });

  const wheelsets = frisoRows.map((row, index) => {
    const key =
      row[frisoCols.identificacao] ||
      `${row[frisoCols.vagao]}_${row[frisoCols.posicao]}`;
    const keyString = String(key);

    const alarm = alarmMap.get(keyString) || {
      acustico: 0,
      impacto: 0,
      hotBox: false,
    };
    const km = kmMap.get(keyString) || 0;
    const friso = parseNumber(row[frisoCols.friso]);

    const kmCondition = calculateKmCondition(km);
    const frisoCondition = calculateFrisoCondition(friso);
    const acousticCondition = calculateAcousticCondition(alarm.acustico);
    const impactCondition = calculateImpactCondition(alarm.impacto);
    const hotBoxCondition = calculateHotBoxCondition(alarm.hotBox);

    const ica =
      kmCondition * ICA_CONFIG.pesoKm +
      frisoCondition * ICA_CONFIG.pesoFriso +
      acousticCondition * ICA_CONFIG.pesoAcustico +
      impactCondition * ICA_CONFIG.pesoImpacto +
      hotBoxCondition * ICA_CONFIG.pesoHotBox;

    const roundedICA = Number(ica.toFixed(1));
    const priority = classifyICA(roundedICA);
    const decision = getDecision(roundedICA);

    const problems = getProblemTypes({
      acustico: alarm.acustico,
      impacto: alarm.impacto,
      hotBox: alarm.hotBox,
      friso,
      km,
    });

    return {
      id: index + 1,
      vagao: String(row[frisoCols.vagao]),
      posicao: String(row[frisoCols.posicao]),
      identificacao: keyString,
      friso,
      km,
      acustico: alarm.acustico,
      impacto: alarm.impacto,
      hotBox: alarm.hotBox,
      kmCondition: Number(kmCondition.toFixed(1)),
      frisoCondition: Number(frisoCondition.toFixed(1)),
      acousticCondition: Number(acousticCondition.toFixed(1)),
      impactCondition: Number(impactCondition.toFixed(1)),
      hotBoxCondition,
      ica: roundedICA,
      priority,
      decision,
      problems,
      hasProblem: problems.length > 0,
    };
  });

  const wagonMap = new Map();
  wheelsets.forEach((wheelset) => {
    if (!wagonMap.has(wheelset.vagao)) wagonMap.set(wheelset.vagao, []);
    wagonMap.get(wheelset.vagao).push(wheelset);
  });

  const wagons = Array.from(wagonMap.entries()).map(([vagao, rodas]) => {
    const worstICA = Math.min(...rodas.map((r) => r.ica));
    const criticalCount = rodas.filter((r) => r.priority === "critico").length;
    const mediumCount = rodas.filter((r) => r.priority === "medio").length;
    const problemCount = rodas.filter((r) => r.hasProblem).length;

    let priority = "baixo";
    if (criticalCount > 0) priority = "critico";
    else if (mediumCount > 0) priority = "medio";

    let decision;
    if (priority === "critico")
      decision = { label: "Abrir nota", type: "nota" };
    else if (priority === "medio")
      decision = { label: "Programar / avaliar", type: "avaliar" };
    else decision = { label: "Não abrir agora", type: "normal" };

    return {
      vagao,
      rodas,
      worstICA,
      priority,
      criticalCount,
      mediumCount,
      problemCount,
      decision,
    };
  });

  return { wheelsets, wagons };
};

/* ============================================================
   BADGES  — paleta Vale: verde-petróleo (#00807C) e amarelo-ouro
   (#EEA722). Vermelho fica reservado só para "crítico" — é
   convenção de segurança, não cor de marca.
   ============================================================ */

function PriorityBadge({ priority }) {
  const config = {
    critico: {
      label: "CRÍTICO",
      classes: "border-red-500/20 bg-red-500/10 text-red-300",
    },
    medio: {
      label: "MÉDIO",
      classes: "border-vale-gold/20 bg-vale-gold/10 text-vale-gold",
    },
    baixo: {
      label: "BAIXO",
      classes: "border-vale-teal/20 bg-vale-teal/10 text-vale-teal",
    },
  };

  const item = config[priority];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] ${item.classes}`} >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {item.label}
    </span>
  );
}

function DecisionBadge({ type, label }) {
  const config = {
    nota: {
      icon: ClipboardPlus,
      classes: "bg-red-500/10 text-red-300 border-red-500/20",
    },
    avaliar: {
      icon: Wrench,
      classes: "bg-vale-gold/10 text-vale-gold border-vale-gold/20",
    },
    normal: {
      icon: ClipboardCheck,
      classes: "bg-vale-teal/10 text-vale-teal border-vale-teal/20",
    },
  };

  const item = config[type];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-semibold ${item.classes}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

// KPI
   
function KPI({
  icon: Icon,
  label,
  value,
  description,
  danger = false,
  warning = false,
}) {
  return (
    <div className={`rounded-2xl border p-5 ${"border border-dashed border-white/10 bg-black/10 p-4 transition hover:border-vale-teal/30 hover:bg-vale-teal/[0.03]"}`} >
      <div className="flex items-end justify-end">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger
              ? "text-red-700" : warning
                ? "text-vale-gold"  : "text-vale-teal" }`} >
          <Icon size={19} />
        </div>
      </div>
      <p className={`mt-5 text-3xl font-bold ${
          danger ? "text-red-800" : warning ? "text-yellow-500" : "text-white" }`} >
        {value}
      </p>
      <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
        {label}
      </p>
    </div>
  );
}

// MATRIZ — SOMENTE RODEIROS CRÍTICOS

function ProblemMatrix({ wheelsets, onSelectWheel }) {
  const critical = wheelsets.filter((wheel) => wheel.priority === "critico");

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#151716]">
      <div className="border-b border-white/[0.07] p-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-red-400">
          Monitoramento de rodeiros
        </p>
        <h3 className="mt-1 text-xl font-bold text-white">Rodeiros críticos</h3>
        <p className="mt-1 text-xs text-slate-500">
          Exibindo somente rodeiros classificados como{" "}
          <strong className="text-red-300">críticos</strong> (ICA abaixo de{" "}
          {ICA_CONFIG.critica}). Os demais podem ser consultados na frota,
          abaixo.
        </p>
      </div>

      {critical.length === 0 ? (
        <div className="p-12 text-center">
          <ShieldCheck size={30} className="mx-auto text-vale-teal/40" />
          <p className="mt-4 text-sm font-semibold text-slate-300">
            Nenhum rodeiro crítico
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Os demais rodeiros podem ser consultados no desenho da frota abaixo.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-black/10">
                {[
                  "Vagão",
                  "Posição",
                  "Identificação",
                  "ICA",
                  "Prioridade",
                  "Decisão",
                  "KM",
                  "Friso",
                  "Acústico",
                  "Impacto",
                  "Hot Box",
                  "Ocorrências",
                ].map((h) => (
                  <th key={h} className="px-5 py-4 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                      {h}
                    </span>
                  </th>
                ))}
                <th />
              </tr>
            </thead>

            <tbody>
              {critical.map((wheel) => (
                <tr key={wheel.identificacao} onClick={() => onSelectWheel(wheel)} className="group cursor-pointer border-b border-white/[0.045] transition hover:bg-white/[0.025]" >
                  <td className="px-5 py-4">
                    <span className="font-bold text-white">{wheel.vagao}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-slate-300">
                      {wheel.posicao}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] text-slate-500">
                      {wheel.identificacao}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-base font-bold text-red-300">
                      {wheel.ica}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <PriorityBadge priority={wheel.priority} />
                  </td>
                  <td className="px-5 py-4">
                    <DecisionBadge type={wheel.decision.type} label={wheel.decision.label} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-300">
                      {wheel.km.toLocaleString("pt-BR")} km
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-300">
                      {wheel.friso.toFixed(2)} mm
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-300">
                      {wheel.acustico || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold ${ wheel.impacto >= ICA_CONFIG.impactoCritico
                          ? "text-red-300" : wheel.impacto >= ICA_CONFIG.impactoAtencao
                            ? "text-vale-gold": "text-slate-400" }`}>
                     {wheel.impacto ? `${wheel.impacto} kN` : "—"}
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
                        <span key={problem} className="rounded-md bg-red-500/10 px-2 py-1 text-[8px] font-bold text-red-300" >
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

// DESENHO DO RODEIRO

function WheelStatus({ wheel }) {
  const config = {
    critico: {
      border: "border-red-500/50",
      bg: "bg-red-500/10",
      color: "text-red-400",
    },
    medio: {
      border: "border-vale-gold/50",
      bg: "bg-vale-gold/10",
      color: "text-vale-gold",
    },
    baixo: {
      border: "border-slate-600",
      bg: "bg-slate-700/20",
      color: "text-slate-500",
    },
  };

  const style = config[wheel.priority];

  return (
    <div className="relative flex flex-col items-center">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${style.border} ${style.bg}`} >
        <div className={`h-3 w-3 rounded-full bg-current ${style.color}`} />
      </div>
      <span className="mt-2 text-[9px] font-bold text-slate-400">
        {wheel.posicao}
      </span>
      <span className={`mt-1 text-[8px] font-bold ${style.color}`}>
        ICA {wheel.ica}
      </span>
    </div>
  );
}

// DESENHO DO VAGÃO — clique abre o card com os 4 rodeiros

function WagonDrawing({ wagon, onClick }) {
  return (
    <button type="button" onClick={() => onClick(wagon)} className={`group relative w-full rounded-2xl border p-5 text-left transition ${
        wagon.criticalCount > 0
          ? "border-red-500/20 bg-red-500/[0.035] hover:border-red-500/40" : wagon.mediumCount > 0
            ? "border-vale-gold/20 bg-vale-gold/[0.025] hover:border-vale-gold/40" : "border-white/[0.07] bg-[#191b1a] hover:border-vale-teal/20" }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
            Vagão
          </p>
          <p className="mt-1 text-lg font-bold text-white">{wagon.vagao}</p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={wagon.priority} />
          <ChevronRight size={16} className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-white" />
        </div>
      </div>

      <div className="relative mt-7">
        <div className="absolute left-[10%] right-[10%] top-[24px] h-[7px] rounded-full bg-slate-700" />
        <div className="grid grid-cols-4 gap-4">
          {wagon.rodas.map((wheel) => (
            <WheelStatus key={wheel.identificacao} wheel={wheel} />
          ))}
        </div>
        <div className="mt-4 h-px bg-white/[0.06]" />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-600">
            Pior ICA
          </p>
          <p className="mt-1 text-sm font-bold text-white">{wagon.worstICA}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-slate-600">
            Rodeiros com ocorrência
          </p>
          <p className={`mt-1 text-sm font-bold ${wagon.problemCount > 0 ? "text-red-300" : "text-vale-teal"}`} >
            {wagon.problemCount}/{wagon.rodas.length}
          </p>
        </div>
      </div>
    </button>
  );
}

// MODAL DO RODEIRO

function WheelModal({ wheel, wagons = [], onClose }) {
  if (!wheel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#171918] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/[0.07] p-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-red-400">
              Detalhamento do rodeiro
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                Vagão {wheel.vagao}
              </h2>
              <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-slate-300">
                {wheel.posicao}
              </span>
              <PriorityBadge priority={wheel.priority} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              ID técnico:{" "}
              <span className="text-slate-300">{wheel.identificacao}</span>
            </p>
          </div>

          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-500 transition hover:bg-white/5 hover:text-white" >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          <div className="grid gap-3 border-b border-white/[0.07] p-6 sm:grid-cols-3">
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                ICA do rodeiro
              </p>
              <p className={`mt-1 text-3xl font-bold ${wheel.priority === "critico" ? "text-red-300" : wheel.priority === "medio" ? "text-vale-gold" : "text-vale-teal"}`} >
                {wheel.ica}
              </p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                Prioridade
              </p>
              <div className="mt-2">
                <PriorityBadge priority={wheel.priority} />
              </div>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                Decisão
              </p>
              <div className="mt-2">
                <DecisionBadge type={wheel.decision.type} label={wheel.decision.label} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem icon={GaugeCircle} label="KM rodado" value={`${wheel.km.toLocaleString("pt-BR")} km`} />
            <DetailItem icon={Ruler} label="Friso" value={`${wheel.friso.toFixed(2)} mm`} />
            <DetailItem icon={Radio} label="Acústico" value={wheel.acustico || "Sem registro"} />
            <DetailItem icon={Activity} label="Impacto" value={wheel.impacto ? `${wheel.impacto} kN` : "Sem registro"} />
            <DetailItem icon={Thermometer} label="Hot Box" value={wheel.hotBox ? "SIM" : "NÃO"} danger={wheel.hotBox}/>
          </div>

          <div className="border-t border-white/[0.07] p-6">
            <div className="mb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Condições avaliadas
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Valores utilizados no cálculo do ICA deste rodeiro.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <DetailItem icon={GaugeCircle} label="Condição KM" value={wheel.kmCondition} />
              <DetailItem icon={Ruler} label="Condição Friso" value={wheel.frisoCondition} />
              <DetailItem icon={Radio} label="Condição Acústico" value={wheel.acousticCondition} />
              <DetailItem icon={Activity} label="Condição Impacto" value={wheel.impactCondition} />
              <DetailItem icon={Thermometer} label="Condição Hot Box" value={wheel.hotBoxCondition} danger={wheel.hotBoxCondition > 0} />
            </div>
          </div>

          <div className="border-t border-white/[0.07] p-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Problemas identificados
            </p>
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

          <div className="border-t border-white/[0.07] p-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-vale-teal">
                  Composição
                </p>
                <h3 className="mt-1 text-base font-bold text-white">
                  Trem e vagões
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Vagão destacado indica a posição do rodeiro selecionado na
                  composição.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {wagons.length} vagões
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/10 p-4">
              <div className="flex min-w-max items-center gap-2">
                <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-vale-teal/20 bg-vale-teal/[0.08]">
                  <TrainFront size={30} className="text-vale-teal" />
                </div>
                {wagons.map((wagon) => {
                  const selected = String(wagon.vagao) === String(wheel.vagao);
                  return (
                    <div key={wagon.vagao} className={`flex h-16 min-w-[92px] flex-col items-center justify-center rounded-xl border px-3 transition ${selected ? "border-red-400/60 bg-red-500/10 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]" : "border-white/[0.07] bg-[#191b1a]"}`} >
                      <TrainFront size={20} className={selected ? "text-red-300" : "text-slate-600"} />
                      <span className={`mt-1 text-[9px] font-bold ${selected ? "text-red-200" : "text-slate-500"}`} >
                        {wagon.vagao}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
        <Icon size={14} className={danger ? "text-red-400" : "text-slate-600"} />
        <span className="text-[9px] uppercase tracking-wider text-slate-600">
          {label}
        </span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${danger ? "text-red-300" : "text-slate-200"}`} >
        {value}
      </p>
    </div>
  );
}

// MODAL DO VAGÃO — mostra os 4 rodeiros e a situação de cada um

function WagonModal({ wagon, onClose }) {
  if (!wagon) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#171918] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/[0.07] p-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-vale-teal">
              Detalhamento da frota
            </p>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                Vagão {wagon.vagao}
              </h2>
              <PriorityBadge priority={wagon.priority} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Visão completa dos quatro rodeiros.
            </p>
          </div>

          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:bg-white/5 hover:text-white" >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-3 border-b border-white/[0.07] p-6 sm:grid-cols-3">
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">
              Pior ICA
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {wagon.worstICA}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">
              Rodeiros com ocorrência
            </p>
            <p className="mt-1 text-2xl font-bold text-red-300">
              {wagon.problemCount}/{wagon.rodas.length}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600">
              Decisão sugerida
            </p>
            <div className="mt-2">
              <DecisionBadge type={wagon.decision.type} label={wagon.decision.label} />
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Os 4 rodeiros do vagão
          </p>

          <div className="grid gap-3 md:grid-cols-4">
            {wagon.rodas.map((wheel) => (
              <div key={wheel.identificacao} className={`rounded-2xl border p-4 ${
                  wheel.priority === "critico"
                    ? "border-red-500/20 bg-red-500/[0.05]" : wheel.priority === "medio"
                      ? "border-vale-gold/20 bg-vale-gold/[0.05]" : "border-white/[0.07] bg-black/10" }`} >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {wheel.posicao}
                  </span>
                  <PriorityBadge priority={wheel.priority} />
                </div>

                <div className="mt-5 flex justify-center">
                  <WheelStatus wheel={wheel} />
                </div>

                <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">ICA</span>
                    <span className="text-xs font-bold text-white">
                      {wheel.ica}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">KM</span>
                    <span className="text-xs text-slate-300">
                      {wheel.km.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">Friso</span>
                    <span className="text-xs text-slate-300">
                      {wheel.friso.toFixed(2)} mm
                    </span>
                  </div>
                </div>

                {wheel.problems.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {wheel.problems.map((problem) => (
                      <span key={problem} className="rounded-md bg-red-500/10 px-2 py-1 text-[8px] font-semibold text-red-300" >
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
          <DecisionBadge
            type={wagon.decision.type}
            label={wagon.decision.label}
          />
        </div>
      </div>
    </div>
  );
}

// PÁGINA

export default function WheelMetrics() {
  const [data, setData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedWagon, setSelectedWagon] = useState(null);
  const [selectedWheel, setSelectedWheel] = useState(null);
  const [search, setSearch] = useState("");

  const handleFile = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const processed = processWorkbook(workbook);
        setData(processed);
        setSelectedWagon(null);
        setSelectedWheel(null);
      } catch (err) {
        console.error(err);
        setData(null);
        setError(err?.message || "Não foi possível processar o arquivo.");
      } finally {
        setLoading(false);
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      setLoading(false);
      setError("Erro ao ler o arquivo.");
      event.target.value = "";
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const reset = () => {
    setData(null);
    setFileName("");
    setError("");
    setSelectedWagon(null);
    setSelectedWheel(null);
    setSearch("");
  };

  const stats = useMemo(() => {
    if (!data)
      return { vagoes: 0, rodas: 0, abrirNota: 0, avaliar: 0, normal: 0 };

    const { wagons, wheelsets } = data;

    return {
      vagoes: wagons.length,
      rodas: wheelsets.length,
      abrirNota: wagons.filter((w) => w.decision.type === "nota").length,
      avaliar: wagons.filter((w) => w.decision.type === "avaliar").length,
      normal: wagons.filter((w) => w.decision.type === "normal").length,
    };
  }, [data]);

  const filteredWagons = useMemo(() => {
    if (!data) return [];
    return data.wagons.filter(
      (wagon) =>
        !search || wagon.vagao.toLowerCase().includes(search.toLowerCase()),
    );
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
                Analise o Índice de Condição do Ativo de cada rodeiro,
                identifique ocorrências e apoie a decisão sobre abertura de nota
                de manutenção.
              </p>

              <div className="mt-7 grid max-w-xl grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    ICA
                  </p>
                  <p className="mt-1 text-xs font-bold text-white">Condição</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    Rodeiro
                  </p>
                  <p className="mt-1 text-xs font-bold text-white">
                    Individual
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    Decisão
                  </p>
                  <p className="mt-1 text-xs font-bold text-white">
                    Manutenção
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/[0.07] p-6 lg:border-l lg:border-t-0 lg:p-8">
              <label className="group flex h-full min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center transition hover:border-vale-teal/30 hover:bg-vale-teal/[0.03]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-vale-teal/10 text-vale-teal">
                  {loading ? (
                    <Activity size={27} className="animate-pulse" />
                  ) : (
                    <UploadCloud size={27} />
                  )}
                </div>

                <h3 className="mt-5 text-base font-bold text-white">
                  {loading
                    ? "Processando documento..." : "Carregar base de manutenção"}
                </h3>

                <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                  Utilize um arquivo contendo as abas
                  <strong className="text-slate-300">
                    {" "}
                    Friso, Alarmes e KM_Rodado
                  </strong>
                  .
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
              <p className="text-sm font-semibold text-red-300">
                Não foi possível processar o documento
              </p>
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
                <span className="text-xs font-semibold text-white">
                  {fileName}
                </span>
              </div>
              <button type="button" onClick={reset} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-white" >
                <RotateCcw size={12} />
                Nova análise
              </button>
            </div>

            {/* KPIs */}
            <section className="mt-7">
              <div className="mb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-vale-teal">
                  Indicadores essenciais
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  Visão geral da análise
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <KPI icon={TrainFront} label="Vagões analisados" value={stats.vagoes} description="frota processada" />
                <KPI icon={Gauge} label="Rodeiros analisados" value={stats.rodas} description="rodeiros processados"/>
                <KPI icon={ClipboardPlus} label="Sugestão de abrir nota" value={stats.abrirNota} description="vagões prioritários" danger={stats.abrirNota > 0} />
                <KPI icon={Wrench} label="Programar / avaliar" value={stats.avaliar} description="requer avaliação" warning={stats.avaliar > 0} />
                <KPI icon={ClipboardCheck} label="Não abrir agora" value={stats.normal} description="acompanhar condição" />
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
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-vale-teal">
                    Visão física da frota
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    Trem e seus vagões
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Todos os vagões da base. Clique em um deles para ver a
                    situação de cada um dos 4 rodeiros.
                  </p>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar vagão..." className="w-full rounded-xl border border-white/10 bg-[#181a19] py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-700 focus:border-vale-teal/30 md:w-52" />
                </div>
              </div>

              {/* Composição ferroviária: locomotiva + vagões clicáveis */}
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#1b201e] to-[#111312] p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Composição operacional
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      {filteredWagons.length} vagões exibidos
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[9px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      Crítico
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-300" />
                      Avaliar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-teal-400" />
                      Normal
                    </span>
                  </div>
                </div>
                {filteredWagons.length > 0 && (
                  <div className="overflow-x-auto pb-5">
                    <div className="flex min-w-max items-end px-2 pt-3">
                      {/* Locomotiva */}
                      <div className="relative flex h-[94px] w-[124px] shrink-0 flex-col items-center justify-center rounded-t-2xl rounded-b-md border border-teal-400/35 bg-gradient-to-b from-teal-400/15 to-teal-900/20 shadow-[0_8px_24px_rgba(45,212,191,0.06)]">
                        <div className="absolute -top-2 left-4 h-3 w-12 rounded-t-md border border-teal-300/30 bg-[#24312e]" />
                        <TrainFront size={34} className="text-teal-300" />
                        <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-teal-200">
                          Locomotiva
                        </span>
                        <span className="absolute -bottom-3 left-5 h-6 w-6 rounded-full border-[3px] border-slate-500 bg-[#0d0f0e] shadow-inner" />
                        <span className="absolute -bottom-3 right-5 h-6 w-6 rounded-full border-[3px] border-slate-500 bg-[#0d0f0e] shadow-inner" />
                      </div>
                      <div className="mb-5 h-2 w-7 shrink-0 rounded-full bg-slate-500" />
                      {filteredWagons.map((wagon, index) => {
                        const critical = wagon.priority === "critico";
                        const medium = wagon.priority === "medio";
                        const accent = critical
                          ? "border-red-400/60" : medium
                            ? "border-amber-300/55" : "border-slate-500/50";
                        const body = critical
                          ? "from-red-500/20 to-red-950/35" : medium
                            ? "from-amber-300/15 to-amber-950/25" : "from-slate-500/15 to-slate-900/40";
                        const status = critical
                          ? "text-red-300" : medium
                            ? "text-amber-200" : "text-teal-300";
                        const dot = critical
                          ? "bg-red-400" : medium
                            ? "bg-amber-300" : "bg-teal-400";
                        return (
                          <div key={wagon.vagao} className="flex shrink-0 items-end" >
                            <div className="mb-5 h-2 w-7 shrink-0 rounded-full bg-slate-500" />
                            <button type="button" onClick={() => setSelectedWagon(wagon)} title={`Consultar os quatro rodeiros do vagão ${wagon.vagao}`} aria-label={`Abrir vagão ${wagon.vagao} e consultar seus quatro rodeiros`} className={`group relative flex h-[82px] w-[112px] shrink-0 flex-col items-center justify-center rounded-md rounded-t-xl border bg-gradient-to-b ${accent} ${body} transition duration-200 hover:-translate-y-1 hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-teal-300/70`} >
                              <span className={`absolute inset-x-2 top-2 h-1 rounded-full ${dot} opacity-80`} />
                              <div className="flex items-center gap-1.5">
                                <TrainFront size={23} className={status} />
                                <span className={`text-[10px] font-extrabold ${status}`} >
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                              </div>
                              <span className="mt-1 max-w-full truncate px-2 text-[10px] font-bold text-slate-100">
                                {wagon.vagao}
                              </span>
                              <span className={`mt-0.5 text-[8px] font-extrabold uppercase tracking-wider ${status}`} >
                                {critical
                                  ? "Crítico": medium
                                    ? "Avaliar": "Normal"}
                              </span>
                              <span className="absolute -bottom-3 left-3 h-6 w-6 rounded-full border-[3px] border-slate-500 bg-[#0d0f0e] shadow-inner" />
                              <span className="absolute -bottom-3 right-3 h-6 w-6 rounded-full border-[3px] border-slate-500 bg-[#0d0f0e] shadow-inner" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mx-2 mt-4 h-[3px] rounded-full bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700" />
                    <div className="mx-2 mt-1 flex justify-between text-[8px] uppercase tracking-[0.15em] text-slate-600">
                      <span>Trilhos</span>
                      <span>Selecione um vagão para abrir os 4 rodeiros</span>
                    </div>
                  </div>
                )}
              </div>

              {filteredWagons.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-[#191b1a] p-10 text-center">
                  <TrainFront size={28} className="mx-auto text-slate-700" />
                  <p className="mt-3 text-sm font-semibold text-slate-400">
                    Nenhum vagão encontrado
                  </p>
                </div>
              ) : null}
            </section>

            {/* INDICADORES OPERACIONAIS */}
            <section className="mt-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-[#161817] px-4 py-3">
                  <p className="text-[8px] uppercase tracking-wider text-slate-600">
                    Backlog
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {OPERACIONAL.backlog.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#161817] px-4 py-3">
                  <p className="text-[8px] uppercase tracking-wider text-slate-600">
                    Surgimento
                  </p>
                  <p className="mt-1 text-lg font-bold text-vale-gold">
                    {OPERACIONAL.surgimento.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#161817] px-4 py-3">
                  <p className="text-[8px] uppercase tracking-wider text-slate-600">
                    Troca
                  </p>
                  <p className="mt-1 text-lg font-bold text-vale-teal">
                    {OPERACIONAL.troca.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <WheelModal wheel={selectedWheel} wagons={data?.wagons || []} onClose={() => setSelectedWheel(null)} />
      <WagonModal wagon={selectedWagon} onClose={() => setSelectedWagon(null)} />

      <footer className="mx-auto max-w-7xl px-6 pb-7 pt-6">
        <div className="border-t border-white/[0.05] pt-5 text-[9px] uppercase tracking-wider text-slate-700">
          WheelMetrics • Apoio à decisão de manutenção ferroviária
        </div>
      </footer>
    </div>
  );
}
