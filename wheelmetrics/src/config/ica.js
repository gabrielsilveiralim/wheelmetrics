export const ICA_CONFIG = {
  kmAtencao: 250000,
  kmCritico: 300000,
  frisoMax: 24.1,
  frisoMin: 22.1,
  impactoAtencao: 220,
  impactoCritico: 250,
  critica: 40,
  media: 70,
  pesoKm: 0.25,
  pesoFriso: 0.30,
  pesoAcustico: 0.15,
  pesoImpacto: 0.15,
  pesoHotBox: 0.15,
};

export const OPERACIONAL = {
  backlog: 22000,
  surgimento: 630,
  troca: 596,
};

export const calculateKmCondition = (km) => {
  if (km <= ICA_CONFIG.kmAtencao) return 100;
  if (km >= ICA_CONFIG.kmCritico) return 0;
  const range = ICA_CONFIG.kmCritico - ICA_CONFIG.kmAtencao;
  return 100 - ((km - ICA_CONFIG.kmAtencao) / range) * 100;
};

export const calculateFrisoCondition = (friso) => {
  if (friso <= ICA_CONFIG.frisoMin) return 0;
  if (friso >= ICA_CONFIG.frisoMax) return 100;
  const range = ICA_CONFIG.frisoMax - ICA_CONFIG.frisoMin;
  return ((friso - ICA_CONFIG.frisoMin) / range) * 100;
};

export const calculateAcousticCondition = (acustico) => {
  const value = Number(acustico) || 0;
  if (value <= 1) return 100;
  if (value >= 6) return 0;
  return 100 - ((value - 1) / 5) * 100;
};

export const calculateImpactCondition = (impacto) => {
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

export const calculateHotBoxCondition = (hotBox) => (hotBox ? 0 : 100);

export const classifyICA = (ica) => {
  if (ica < ICA_CONFIG.critica) return 'critico';
  if (ica < ICA_CONFIG.media) return 'medio';
  return 'baixo';
};

export const getDecision = (ica) => {
  if (ica < 40) return { label: 'Abrir nota', type: 'nota' };
  if (ica < 60) return { label: 'Programar / avaliar', type: 'avaliar' };
  return { label: 'Não abrir agora', type: 'normal' };
};

export const getProblemTypes = ({ acustico, impacto, hotBox, friso, km }) => {
  const problems = [];
  if (hotBox) problems.push('Hot Box');

  if (Number(impacto) >= ICA_CONFIG.impactoCritico) {
    problems.push('Impacto crítico');
  } else if (Number(impacto) >= ICA_CONFIG.impactoAtencao) {
    problems.push('Impacto');
  }

  if (Number(acustico) >= 4) problems.push(`Acústico nível ${acustico}`);
  if (friso <= ICA_CONFIG.frisoMin) problems.push('Friso');

  if (km >= ICA_CONFIG.kmCritico) {
    problems.push('Quilometragem');
  } else if (km >= ICA_CONFIG.kmAtencao) {
    problems.push('Quilometragem em atenção');
  }

  return problems;
};
