import { defaults, planDefaults, settings } from './market.mjs';

export const profileVersion = 2;
export const profileDefaults = { scanner: defaults, plan: planDefaults };
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

// Only the destination is personal in the general overview.
export function overviewSettings(input = {}) {
  return { ...defaults, destination: input.destination === 'npc' ? 'npc' : 'bazaar' };
}

export function restoreProfiles(saved, legacy) {
  if (saved != null) {
    const data = record(saved);
    return {
      scanner: overviewSettings(record(data.scanner)),
      plan: data.plan && typeof data.plan === 'object' && !Array.isArray(data.plan)
        ? settings(data.plan, planDefaults) : migratedPlan(legacy ?? data.scanner),
    };
  }
  return { scanner: overviewSettings(record(legacy)), plan: migratedPlan(legacy) };
}

function migratedPlan(legacy) {
  const previous = settings(record(legacy));
  const retained = Object.fromEntries(['budget', 'tax', 'destination'].map(key => [key, previous[key]]));
  return settings(retained, planDefaults);
}

export function saveProfiles(profiles) {
  return { version: profileVersion, scanner: { destination: profiles.scanner.destination }, plan: profiles.plan };
}
