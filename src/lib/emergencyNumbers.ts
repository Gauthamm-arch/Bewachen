import { COUNTRIES } from "./countries";

export type EmergencyService = "ambulance" | "police" | "fire";
export type EmergencyNumbers = Record<EmergencyService, string>;

export const SERVICE_LABELS: Record<EmergencyService, string> = {
  ambulance: "Ambulance",
  police: "Police",
  fire: "Fire",
};

// Used when the country is missing or not in the table below.
// 112 is the GSM standard: mobile networks in most countries route it to local emergency services.
export const FALLBACK_NUMBER = "112";

const one = (n: string): EmergencyNumbers => ({ ambulance: n, police: n, fire: n });

// Keys are ISO 3166-1 alpha-2 codes, matching src/lib/countries.ts.
// NOTE: numbers change over time and sources disagree. Re-check against each
// government's official site before real-world use.
export const EMERGENCY_NUMBERS: Record<string, EmergencyNumbers> = {
  AE: { ambulance: "998", police: "999", fire: "997" },
  AU: one("000"),
  BR: { ambulance: "192", police: "190", fire: "193" },
  CA: one("911"),
  CN: { ambulance: "120", police: "110", fire: "119" },
  DE: { ambulance: "112", police: "110", fire: "112" },
  EG: { ambulance: "123", police: "122", fire: "180" },
  ES: one("112"),
  FR: { ambulance: "15", police: "17", fire: "18" },
  GB: one("999"),
  IN: one("112"),
  IT: { ambulance: "118", police: "113", fire: "115" },
  JP: { ambulance: "119", police: "110", fire: "119" },
  KR: { ambulance: "119", police: "112", fire: "119" },
  MX: one("911"),
  NG: one("112"),
  PK: { ambulance: "115", police: "15", fire: "16" },
  PH: one("911"),
  RU: one("112"),
  SA: { ambulance: "997", police: "999", fire: "998" },
  SG: { ambulance: "995", police: "999", fire: "995" },
  TR: one("112"),
  US: one("911"),
  ZA: { ambulance: "10177", police: "10111", fire: "112" },
};

export function getEmergencyNumber(
  countryCode: string | null | undefined,
  service: EmergencyService
): string {
  if (!countryCode) return FALLBACK_NUMBER;
  return EMERGENCY_NUMBERS[countryCode.toUpperCase()]?.[service] ?? FALLBACK_NUMBER;
}

export function getCountryName(countryCode: string | null | undefined): string {
  if (!countryCode) return "Unknown location";
  return COUNTRIES.find((c) => c.code === countryCode.toUpperCase())?.name ?? countryCode;
}
