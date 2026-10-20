import { defaults, planDefaults, settings } from './market.mjs';

export const profileVersion = 1;
export const profileDefaults = { scanner: defaults, plan: planDefaults };
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export function restoreProfiles(saved, legacy) {
  if (saved != null) {
    const data = record(saved);
    return {
      scanner: settings(record(data.scanner), defaults),
      plan: settings(record(data.plan), planDefaults),
    };
  }
  const scanner = settings(record(legacy));
  const retained = Object.fromEntries(['budget', 'tax', 'destination'].map(key => [key, scanner[key]]));
  return { scanner, plan: settings(retained, planDefaults) };
}

export function saveProfiles(profiles) {
  return { version: profileVersion, scanner: profiles.scanner, plan: profiles.plan };
}
