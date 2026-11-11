/**
 * Emergency number mappings by country code (ISO 3166-1 alpha-2).
 *
 * Each entry maps to the local numbers for Ambulance, Police, and Fire services.
 * The `universal` field is a single number that routes to all services (e.g., 911, 112).
 */

export interface EmergencyNumbers {
  country: string;
  countryCode: string;
  universal?: string;
  ambulance: string;
  police: string;
  fire: string;
}

export const EMERGENCY_NUMBERS: Record<string, EmergencyNumbers> = {
  US: {
    country: "United States",
    countryCode: "US",
    universal: "911",
    ambulance: "911",
    police: "911",
    fire: "911",
  },
  GB: {
    country: "United Kingdom",
    countryCode: "GB",
    universal: "999",
    ambulance: "999",
    police: "999",
    fire: "999",
  },
  AE: {
    country: "United Arab Emirates",
    countryCode: "AE",
    ambulance: "998",
    police: "999",
    fire: "997",
  },
  DE: {
    country: "Germany",
    countryCode: "DE",
    universal: "112",
    ambulance: "112",
    police: "110",
    fire: "112",
  },
  FR: {
    country: "France",
    countryCode: "FR",
    universal: "112",
    ambulance: "15",
    police: "17",
    fire: "18",
  },
  IN: {
    country: "India",
    countryCode: "IN",
    universal: "112",
    ambulance: "108",
    police: "100",
    fire: "101",
  },
  JP: {
    country: "Japan",
    countryCode: "JP",
    ambulance: "119",
    police: "110",
    fire: "119",
  },
  AU: {
    country: "Australia",
    countryCode: "AU",
    universal: "000",
    ambulance: "000",
    police: "000",
    fire: "000",
  },
  CA: {
    country: "Canada",
    countryCode: "CA",
    universal: "911",
    ambulance: "911",
    police: "911",
    fire: "911",
  },
  BR: {
    country: "Brazil",
    countryCode: "BR",
    ambulance: "192",
    police: "190",
    fire: "193",
  },
  CN: {
    country: "China",
    countryCode: "CN",
    ambulance: "120",
    police: "110",
    fire: "119",
  },
  KR: {
    country: "South Korea",
    countryCode: "KR",
    ambulance: "119",
    police: "112",
    fire: "119",
  },
  SG: {
    country: "Singapore",
    countryCode: "SG",
    ambulance: "995",
    police: "999",
    fire: "995",
  },
  ZA: {
    country: "South Africa",
    countryCode: "ZA",
    universal: "112",
    ambulance: "10177",
    police: "10111",
    fire: "10177",
  },
  SA: {
    country: "Saudi Arabia",
    countryCode: "SA",
    ambulance: "997",
    police: "999",
    fire: "998",
  },
  EG: {
    country: "Egypt",
    countryCode: "EG",
    ambulance: "123",
    police: "122",
    fire: "180",
  },
  IT: {
    country: "Italy",
    countryCode: "IT",
    universal: "112",
    ambulance: "118",
    police: "113",
    fire: "115",
  },
  ES: {
    country: "Spain",
    countryCode: "ES",
    universal: "112",
    ambulance: "112",
    police: "091",
    fire: "080",
  },
  MX: {
    country: "Mexico",
    countryCode: "MX",
    universal: "911",
    ambulance: "911",
    police: "911",
    fire: "911",
  },
  PH: {
    country: "Philippines",
    countryCode: "PH",
    universal: "911",
    ambulance: "911",
    police: "911",
    fire: "911",
  },
  PK: {
    country: "Pakistan",
    countryCode: "PK",
    ambulance: "115",
    police: "15",
    fire: "16",
  },
  NG: {
    country: "Nigeria",
    countryCode: "NG",
    ambulance: "199",
    police: "199",
    fire: "199",
  },
  RU: {
    country: "Russia",
    countryCode: "RU",
    universal: "112",
    ambulance: "103",
    police: "102",
    fire: "101",
  },
  TR: {
    country: "Turkey",
    countryCode: "TR",
    universal: "112",
    ambulance: "112",
    police: "155",
    fire: "110",
  },
  NL: {
    country: "Netherlands",
    countryCode: "NL",
    universal: "112",
    ambulance: "112",
    police: "112",
    fire: "112",
  },
  SE: {
    country: "Sweden",
    countryCode: "SE",
    universal: "112",
    ambulance: "112",
    police: "112",
    fire: "112",
  },
  CH: {
    country: "Switzerland",
    countryCode: "CH",
    ambulance: "144",
    police: "117",
    fire: "118",
  },
  MY: {
    country: "Malaysia",
    countryCode: "MY",
    universal: "999",
    ambulance: "999",
    police: "999",
    fire: "994",
  },
  TH: {
    country: "Thailand",
    countryCode: "TH",
    ambulance: "1669",
    police: "191",
    fire: "199",
  },
  KE: {
    country: "Kenya",
    countryCode: "KE",
    universal: "999",
    ambulance: "999",
    police: "999",
    fire: "999",
  },
  LB: {
    country: "Lebanon",
    countryCode: "LB",
    ambulance: "140",
    police: "112",
    fire: "175",
  },
  JO: {
    country: "Jordan",
    countryCode: "JO",
    universal: "911",
    ambulance: "911",
    police: "911",
    fire: "911",
  },
};

/**
 * List of all supported countries for dropdowns.
 */
export const SUPPORTED_COUNTRIES = Object.entries(EMERGENCY_NUMBERS).map(
  ([code, data]) => ({
    code,
    name: data.country,
  })
);

export type EmergencyServiceType = "ambulance" | "police" | "fire";

/**
 * Get the emergency number for a specific service type in a given country.
 */
export function getEmergencyNumber(
  countryCode: string,
  serviceType: EmergencyServiceType
): string {
  const numbers = EMERGENCY_NUMBERS[countryCode.toUpperCase()];
  if (!numbers) {
    // Fallback to international emergency number
    return "112";
  }
  return numbers[serviceType];
}

/**
 * Get all emergency numbers for a country.
 */
export function getCountryEmergencyNumbers(
  countryCode: string
): EmergencyNumbers | null {
  return EMERGENCY_NUMBERS[countryCode.toUpperCase()] || null;
}
