// Keep a refreshed dialog in the profile it belongs to, even after allocation changes.
export function detailContext(view, candidate, position) {
  const inPlan = view === 'plan';
  return {
    displayed: inPlan && position ? position : candidate,
    planned: inPlan && Boolean(position),
    missingFromPlan: inPlan && !position,
    quantityLabel: inPlan ? position ? 'Geplante Kaufmenge' : 'Kapazitätsalternative · Planprofil' : 'Referenzmenge (Modell)',
    capitalLabel: inPlan ? !position ? 'Einsatz · Kapazitätsalternative' : 'Gebundenes Budget' : 'Referenzeinsatz (Modell)',
    profitLabel: inPlan && !position ? 'Gewinn · Kapazitätsalternative' : 'Positionsgewinn (Modell)',
    note: inPlan && !position
      ? 'Dieses Item ist nicht mehr im aktuellen Investitionsplan. Die folgenden Zahlen zeigen ausschließlich die Kapazitätsalternative mit deinem Planprofil und sind keine aktuelle Kaufempfehlung.'
      : inPlan ? 'Investitionsplan' : 'Marktübersicht: alternative Einzelposition mit 1 Mio. Coins Referenzbudget, 1 Stunde und 1 % angenommenem Marktanteil. Feste Vergleichsbasis, unabhängig von deinem Investitionsplan.',
  };
}
