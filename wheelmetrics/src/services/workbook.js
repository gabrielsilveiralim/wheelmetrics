import * as XLSX from 'xlsx';

import {
  ICA_CONFIG,
  calculateAcousticCondition,
  calculateFrisoCondition,
  calculateHotBoxCondition,
  calculateImpactCondition,
  calculateKmCondition,
  classifyICA,
  getDecision,
  getProblemTypes,
} from '../config/ica';

export const readWorkbook = (arrayBuffer) => XLSX.read(arrayBuffer, { type: 'array' });

const normalizeHeader = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const findColumn = (headers, patterns) => {
  const normalized = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  for (const pattern of patterns) {
    const match = normalized.find((item) =>
      item.normalized.includes(normalizeHeader(pattern))
    );
    if (match) return match.original;
  }
  return null;
};

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined || value === '') return 0;

  let text = String(value).trim().replace(/[^\d,.-]/g, '');

  if (text.includes('.') && text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (text.includes('.') && /\.\d{3}$/.test(text)) {
    text = text.replace(/\./g, '');
  } else {
    text = text.replace(',', '.');
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
};

const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

const isYes = (value) =>
  ['sim', 'yes', 'true', '1', 's', 'x'].includes(normalizeValue(value));

export const processWorkbook = (workbook) => {
  const requiredSheets = ['Friso', 'Alarmes', 'KM_Rodado'];
  const missingSheets = requiredSheets.filter(
    (sheet) => !workbook.SheetNames.includes(sheet)
  );

  if (missingSheets.length) {
    throw new Error(
      `A planilha precisa possuir as abas: Friso, Alarmes e KM_Rodado. Faltando: ${missingSheets.join(', ')}.`
    );
  }

  const readSheet = (sheetName) =>
    XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  const frisoRows = readSheet('Friso');
  const alarmRows = readSheet('Alarmes');
  const kmRows = readSheet('KM_Rodado');

  if (!frisoRows.length) throw new Error('A aba Friso está vazia.');
  if (!alarmRows.length) throw new Error('A aba Alarmes está vazia.');
  if (!kmRows.length) throw new Error('A aba KM_Rodado está vazia.');

  const frisoHeaders = Object.keys(frisoRows[0]);
  const alarmHeaders = Object.keys(alarmRows[0]);
  const kmHeaders = Object.keys(kmRows[0]);

  const frisoCols = {
    vagao: findColumn(frisoHeaders, ['vagao', 'wagon']),
    posicao: findColumn(frisoHeaders, ['posicao', 'rodeiro']),
    identificacao: findColumn(frisoHeaders, ['identificacao_tecnica', 'identificacao']),
    friso: findColumn(frisoHeaders, ['friso_mm', 'friso']),
  };

  const alarmCols = {
    vagao: findColumn(alarmHeaders, ['vagao']),
    posicao: findColumn(alarmHeaders, ['posicao', 'rodeiro']),
    identificacao: findColumn(alarmHeaders, ['identificacao_tecnica', 'identificacao']),
    acustico: findColumn(alarmHeaders, ['acustico']),
    impacto: findColumn(alarmHeaders, ['impacto']),
    hotBox: findColumn(alarmHeaders, ['hotbox', 'hot_box']),
  };

  const kmCols = {
    vagao: findColumn(kmHeaders, ['vagao']),
    posicao: findColumn(kmHeaders, ['posicao', 'rodeiro']),
    identificacao: findColumn(kmHeaders, ['identificacao_tecnica', 'identificacao']),
    km: findColumn(kmHeaders, ['km_rodado', 'quilometragem', 'km']),
  };

  const validateColumns = (columns, sheetName) => {
    const required = Object.entries(columns)
      .filter(
        ([key]) =>
          !(sheetName === 'Alarmes' &&
            ['acustico', 'impacto', 'hotBox'].includes(key))
      )
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (required.length) {
      throw new Error(
        `Não foi possível identificar as colunas ${required.join(', ')} na aba ${sheetName}.`
      );
    }
  };

  validateColumns(frisoCols, 'Friso');
  validateColumns(alarmCols, 'Alarmes');
  validateColumns(kmCols, 'KM_Rodado');

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
    const criticalCount = rodas.filter((r) => r.priority === 'critico').length;
    const mediumCount = rodas.filter((r) => r.priority === 'medio').length;
    const problemCount = rodas.filter((r) => r.hasProblem).length;

    let priority = 'baixo';
    if (criticalCount > 0) priority = 'critico';
    else if (mediumCount > 0) priority = 'medio';

    let decision;
    if (priority === 'critico') decision = { label: 'Abrir nota', type: 'nota' };
    else if (priority === 'medio') {
      decision = { label: 'Programar / avaliar', type: 'avaliar' };
    } else {
      decision = { label: 'Não abrir agora', type: 'normal' };
    }

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
