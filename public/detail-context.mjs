// Keep a refreshed dialog in the profile it belongs to, even after allocation changes.
export function detailContext(view, candidate, position) {
  const inPlan = view === 'plan';
  return {
    displayed: inPlan && position ? position : candidate,
    planned: inPlan && Boolean(position),
    missingFromPlan: inPlan && !position,
    quantityLabel: inPlan ? position ? 'Geplante Kaufmenge' : 'Kapazitätsalternative · Planprofil' : 'Positionsgröße (Modell)',
    capitalLabel: inPlan && !position ? 'Einsatz · Kapazitätsalternative' : 'Gebundenes Budget',
    profitLabel: inPlan && !position ? 'Gewinn · Kapazitätsalternative' : 'Positionsgewinn (Modell)',
    note: inPlan && !position
      ? 'Dieses Item ist nicht mehr im aktuellen Investitionsplan. Die folgenden Zahlen zeigen ausschließlich die Kapazitätsalternative mit deinem Planprofil und sind keine aktuelle Kaufempfehlung.'
      : inPlan ? 'Investitionsplan' : 'Alle Flips: alternative Einzelposition mit dem Scannerbudget. Diese Ansicht verwendet ausschließlich deine Scannerfilter.',
  };
}
