import { ScanSession, RecurrenceFlag } from '../types/diagnostic';

export class RecurrenceEngine {
  /**
   * Analyzes a list of patient scan sessions to detect recurrence patterns:
   * 1. 2+ UTI-positive scans within rolling 6-month window -> Recurrent UTI flag
   * 2. Repeating organism across visits -> Repeat Organism flag
   * 3. Resistance worsening for the same drug -> Resistance Change flag
   */
  public static analyzePatientRecurrence(
    scans: ScanSession[],
    currentSession?: ScanSession
  ): RecurrenceFlag[] {
    const flags: RecurrenceFlag[] = [];
    if (!scans || scans.length === 0) return flags;

    // Combine past scans with current session if provided and not already included
    const allScans = currentSession
      ? [currentSession, ...scans.filter((s) => s.id !== currentSession.id)]
      : [...scans];

    // Sort chronologically (newest first)
    allScans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const now = currentSession ? new Date(currentSession.timestamp) : new Date();
    const sixMonthsAgo = new Date(now.getTime());
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Filter positive UTI scans in rolling 6-month window
    const positiveScansIn6Months = allScans.filter((s) => {
      const scanDate = new Date(s.timestamp);
      const isPositive =
        s.layer1.infectionLevel !== 'Negative' ||
        s.layer2.pathogens.some((p) => p.detected);
      return scanDate >= sixMonthsAgo && isPositive;
    });

    // 1. Recurrent UTI Pattern Flag (2+ positive scans in 6 months)
    if (positiveScansIn6Months.length >= 2) {
      flags.push({
        flagType: 'recurrent_uti',
        windowMonths: 6,
        occurrences: positiveScansIn6Months.length,
        detail: `Recurrent UTI pattern detected: ${positiveScansIn6Months.length} positive scans recorded in the past 6 months.`,
        severity: positiveScansIn6Months.length >= 3 ? 'critical' : 'warning',
      });
    }

    // 2. Repeat Organism Flag (Same pathogen detected across multiple visits)
    const pathogenCounts: Record<string, { count: number; name: string }> = {};
    for (const scan of positiveScansIn6Months) {
      const detected = scan.layer2.pathogens.filter((p) => p.detected);
      for (const p of detected) {
        if (!pathogenCounts[p.id]) {
          pathogenCounts[p.id] = { count: 0, name: p.name };
        }
        pathogenCounts[p.id].count += 1;
      }
    }

    for (const [id, data] of Object.entries(pathogenCounts)) {
      if (data.count >= 2) {
        flags.push({
          flagType: 'repeat_organism',
          windowMonths: 6,
          occurrences: data.count,
          pathogen: id,
          pathogenName: data.name,
          detail: `Repeat infection detected with ${data.name} (${data.count} visits in past 6 months).`,
          severity: 'warning',
        });
      }
    }

    // 3. Worsening Resistance Change Flag (Sensitive -> Resistant for same drug across visits)
    if (allScans.length >= 2) {
      const newestScan = allScans[0];
      const previousScans = allScans.slice(1);

      for (const newDrug of newestScan.layer3.antibiotics) {
        if (newDrug.status === 'Resistant') {
          // Check if this drug was previously Sensitive in an earlier visit
          for (const prevScan of previousScans) {
            const prevDrug = prevScan.layer3.antibiotics.find((d) => d.id === newDrug.id);
            if (prevDrug && prevDrug.status === 'Sensitive') {
              const prevDate = new Date(prevScan.timestamp).toLocaleDateString();
              flags.push({
                flagType: 'resistance_change',
                windowMonths: 6,
                occurrences: 1,
                drugName: newDrug.name,
                detail: `Resistance change detected: ${newDrug.name} evolved from Sensitive (${prevDate}) to Resistant.`,
                severity: 'critical',
              });
              break;
            }
          }
        }
      }
    }

    return flags;
  }
}
