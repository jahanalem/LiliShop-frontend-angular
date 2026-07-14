/**
 * IANA timezone → ISO 3166-1 alpha-2 country.
 *
 * Used for privacy-friendly first-visit language detection: the device timezone
 * (`Intl.DateTimeFormat().resolvedOptions().timeZone`) reflects where the user actually is —
 * unlike the browser UI language, which is often English for users in Iran, Turkey, China, …
 * No network call, no IP address, no geolocation permission is involved; the timezone is
 * information every website already receives.
 *
 * This is static world geography (which country a zone belongs to), so it lives in code;
 * WHICH LANGUAGE a country maps to stays data-driven in the backend Language table.
 * An unmapped zone simply falls through to the browser-language step of the chain.
 */
export const TIMEZONE_TO_COUNTRY: Readonly<Record<string, string>> = {
  // Europe
  'Europe/Berlin': 'DE', 'Europe/Busingen': 'DE',
  'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH', 'Europe/Vaduz': 'LI', 'Europe/Luxembourg': 'LU',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR', 'Europe/Monaco': 'MC', 'Europe/Brussels': 'BE', 'Europe/Amsterdam': 'NL',
  'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Africa/Ceuta': 'ES',
  'Europe/Lisbon': 'PT', 'Atlantic/Madeira': 'PT', 'Atlantic/Azores': 'PT',
  'Europe/Rome': 'IT', 'Europe/Vatican': 'VA', 'Europe/San_Marino': 'SM', 'Europe/Malta': 'MT',
  'Europe/Copenhagen': 'DK', 'America/Nuuk': 'GL', 'Atlantic/Faroe': 'FO',
  'Europe/Stockholm': 'SE', 'Europe/Mariehamn': 'AX',
  'Europe/Oslo': 'NO', 'Europe/Helsinki': 'FI', 'Europe/Reykjavik': 'IS',
  'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Bratislava': 'SK', 'Europe/Budapest': 'HU',
  'Europe/Ljubljana': 'SI', 'Europe/Zagreb': 'HR', 'Europe/Sarajevo': 'BA', 'Europe/Belgrade': 'RS',
  'Europe/Skopje': 'MK', 'Europe/Tirane': 'AL', 'Europe/Podgorica': 'ME', 'Europe/Sofia': 'BG',
  'Europe/Bucharest': 'RO', 'Europe/Chisinau': 'MD', 'Europe/Athens': 'GR', 'Europe/Nicosia': 'CY',
  'Asia/Nicosia': 'CY', 'Europe/Istanbul': 'TR',
  'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA', 'Europe/Minsk': 'BY',
  'Europe/Moscow': 'RU', 'Europe/Kaliningrad': 'RU', 'Europe/Samara': 'RU', 'Europe/Volgograd': 'RU',
  'Europe/Saratov': 'RU', 'Europe/Astrakhan': 'RU', 'Europe/Ulyanovsk': 'RU', 'Europe/Kirov': 'RU',
  'Asia/Yekaterinburg': 'RU', 'Asia/Omsk': 'RU', 'Asia/Novosibirsk': 'RU', 'Asia/Barnaul': 'RU',
  'Asia/Tomsk': 'RU', 'Asia/Novokuznetsk': 'RU', 'Asia/Krasnoyarsk': 'RU', 'Asia/Irkutsk': 'RU',
  'Asia/Chita': 'RU', 'Asia/Yakutsk': 'RU', 'Asia/Khandyga': 'RU', 'Asia/Vladivostok': 'RU',
  'Asia/Ust-Nera': 'RU', 'Asia/Magadan': 'RU', 'Asia/Sakhalin': 'RU', 'Asia/Srednekolymsk': 'RU',
  'Asia/Kamchatka': 'RU', 'Asia/Anadyr': 'RU',
  'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT', 'Europe/Tallinn': 'EE',

  // Middle East / Central Asia
  'Asia/Tehran': 'IR',
  'Asia/Kabul': 'AF', 'Asia/Dushanbe': 'TJ',
  'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Muscat': 'OM', 'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH', 'Asia/Kuwait': 'KW', 'Asia/Baghdad': 'IQ', 'Asia/Amman': 'JO',
  'Asia/Damascus': 'SY', 'Asia/Beirut': 'LB', 'Asia/Gaza': 'PS', 'Asia/Hebron': 'PS',
  'Asia/Aden': 'YE', 'Asia/Jerusalem': 'IL',
  'Asia/Baku': 'AZ', 'Asia/Yerevan': 'AM', 'Asia/Tbilisi': 'GE',
  'Asia/Ashgabat': 'TM', 'Asia/Tashkent': 'UZ', 'Asia/Samarkand': 'UZ',
  'Asia/Almaty': 'KZ', 'Asia/Aqtobe': 'KZ', 'Asia/Aqtau': 'KZ', 'Asia/Atyrau': 'KZ',
  'Asia/Oral': 'KZ', 'Asia/Qostanay': 'KZ', 'Asia/Qyzylorda': 'KZ',
  'Asia/Bishkek': 'KG',

  // Africa
  'Africa/Cairo': 'EG', 'Africa/Tripoli': 'LY', 'Africa/Tunis': 'TN', 'Africa/Algiers': 'DZ',
  'Africa/Casablanca': 'MA', 'Africa/El_Aaiun': 'EH', 'Africa/Khartoum': 'SD',
  'Africa/Nouakchott': 'MR', 'Africa/Mogadishu': 'SO', 'Africa/Djibouti': 'DJ',
  'Indian/Comoro': 'KM',
  'Africa/Lagos': 'NG', 'Africa/Accra': 'GH', 'Africa/Nairobi': 'KE', 'Africa/Addis_Ababa': 'ET',
  'Africa/Johannesburg': 'ZA', 'Africa/Windhoek': 'NA', 'Africa/Harare': 'ZW',
  'Africa/Dar_es_Salaam': 'TZ', 'Africa/Kampala': 'UG', 'Africa/Kinshasa': 'CD',
  'Africa/Abidjan': 'CI', 'Africa/Dakar': 'SN', 'Africa/Bamako': 'ML',

  // South / East / Southeast Asia
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP',
  'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN', 'Asia/Urumqi': 'CN',
  'Asia/Hong_Kong': 'HK', 'Asia/Macau': 'MO', 'Asia/Taipei': 'TW',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Pyongyang': 'KP',
  'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID',
  'Asia/Jayapura': 'ID', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Phnom_Penh': 'KH',
  'Asia/Vientiane': 'LA', 'Asia/Yangon': 'MM', 'Asia/Manila': 'PH', 'Asia/Brunei': 'BN',
  'Asia/Ulaanbaatar': 'MN',

  // Americas
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Phoenix': 'US',
  'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
  'America/Detroit': 'US', 'America/Indiana/Indianapolis': 'US', 'America/Boise': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA', 'America/Regina': 'CA',
  'America/Mexico_City': 'MX', 'America/Tijuana': 'MX', 'America/Monterrey': 'MX',
  'America/Cancun': 'MX', 'America/Merida': 'MX', 'America/Chihuahua': 'MX', 'America/Hermosillo': 'MX',
  'America/Guatemala': 'GT', 'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI', 'America/Costa_Rica': 'CR', 'America/Panama': 'PA',
  'America/Havana': 'CU', 'America/Santo_Domingo': 'DO', 'America/Puerto_Rico': 'PR',
  'America/Jamaica': 'JM', 'America/Port-au-Prince': 'HT',
  'America/Bogota': 'CO', 'America/Caracas': 'VE', 'America/Guayaquil': 'EC', 'Pacific/Galapagos': 'EC',
  'America/Lima': 'PE', 'America/La_Paz': 'BO', 'America/Asuncion': 'PY', 'America/Montevideo': 'UY',
  'America/Santiago': 'CL', 'Pacific/Easter': 'CL',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Argentina/Cordoba': 'AR',
  'America/Argentina/Mendoza': 'AR', 'America/Argentina/Salta': 'AR',
  'America/Sao_Paulo': 'BR', 'America/Manaus': 'BR', 'America/Fortaleza': 'BR',
  'America/Recife': 'BR', 'America/Bahia': 'BR', 'America/Belem': 'BR', 'America/Cuiaba': 'BR',

  // Oceania
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Australia/Hobart': 'AU',
  'Australia/Darwin': 'AU', 'Pacific/Auckland': 'NZ', 'Pacific/Fiji': 'FJ',
  'Pacific/Port_Moresby': 'PG',
};

/** Resolves the device's country from its IANA timezone; null when the zone is unmapped. */
export function countryFromTimezone(timezone: string | undefined | null): string | null {
  if (!timezone) {
    return null;
  }
  return TIMEZONE_TO_COUNTRY[timezone] ?? null;
}
