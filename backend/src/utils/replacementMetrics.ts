import client from 'prom-client';

// Histogram: Score-Verteilung (Buckets für OPTIMAL/GOOD/ACCEPTABLE/NOT_RECOMMENDED)
export const replacementScoreHistogram = new client.Histogram({
  name: 'replacement_score_total',
  help: 'Distribution of replacement candidate total scores (0-100)',
  labelNames: ['recommendation'] as const,
  buckets: [0, 40, 60, 80, 100], // NOT_RECOMMENDED, ACCEPTABLE, GOOD, OPTIMAL
});

// Histogram: Berechnungsdauer (in Sekunden)
export const replacementCalculationDuration = new client.Histogram({
  name: 'replacement_calculation_duration_seconds',
  help: 'Time spent calculating replacement scores per candidate',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25], // 1ms bis 250ms
});

// Counter: Anzahl bewerteter Kandidaten
export const replacementCandidatesEvaluated = new client.Counter({
  name: 'replacement_candidates_evaluated_total',
  help: 'Total number of replacement candidates evaluated',
  labelNames: ['shift_id'] as const,
});

// Gauge: Durchschnittliche Komponenten-Scores (zur Analyse)
export const replacementScoreComponentsGauge = new client.Gauge({
  name: 'replacement_score_components_avg',
  help: 'Average score per component (workload, compliance, fairness, preference)',
  labelNames: ['component'] as const,
});

// Helper: Metriken aktualisieren
export function recordCandidateScore(
  totalScore: number,
  recommendation: string,
  durationSeconds: number,
  components: { workload: number; compliance: number; fairness: number; preference: number },
  shiftId: string,
): void {
  replacementScoreHistogram.labels(recommendation).observe(totalScore);
  replacementCalculationDuration.observe(durationSeconds);
  replacementCandidatesEvaluated.labels(shiftId).inc();

  // Update component averages (Gauges zeigen letzten Wert, nicht Durchschnitt - für Durchschnitt später in Stats)
  replacementScoreComponentsGauge.labels('workload').set(components.workload);
  replacementScoreComponentsGauge.labels('compliance').set(components.compliance);
  replacementScoreComponentsGauge.labels('fairness').set(components.fairness);
  replacementScoreComponentsGauge.labels('preference').set(components.preference);
}
