import { readFileSync } from "fs"
import maxmind, { Reader, CityResponse, AsnResponse } from "maxmind"
import { cityFile, asnFile } from "./dbInit"

export const validate = maxmind.validate

const VALID_FIELDS = new Set([
  "city",
  "continent",
  "subdivision",
  "postal",
  "location",
  "asn",
] as const)

export type FieldName = typeof VALID_FIELDS extends Set<infer T> ? T : never

export interface AsnResult {
  number: number
  organization: string
}

export interface LookupResult {
  ip: string
  country: string | null
  city?: string | null
  continent?: string | null
  subdivision?: string | null
  postal?: string | null
  location?: {
    latitude: number
    longitude: number
    accuracy_radius: number
    time_zone: string | null
  } | null
  asn?: AsnResult | null
}

let cityReader: Reader<CityResponse>
let asnReader: Reader<AsnResponse>

export function initReaders(): void {
  cityReader = new Reader<CityResponse>(readFileSync(cityFile))
  asnReader = new Reader<AsnResponse>(readFileSync(asnFile))
}

export function getMetadata() {
  return cityReader.metadata
}

export function parseFields(fieldsParam: string | undefined): Set<FieldName> {
  if (!fieldsParam) return new Set()

  const fields = new Set<FieldName>()
  for (const f of fieldsParam.split(",")) {
    const trimmed = f.trim() as FieldName
    if (VALID_FIELDS.has(trimmed)) {
      fields.add(trimmed)
    }
  }
  return fields
}

export function lookupCountry(ip: string): string | undefined {
  const record = cityReader.get(ip)
  if (record && record.country) {
    return record.country.iso_code
  }
}

export function lookupIp(
  ip: string,
  fields: Set<FieldName>,
): LookupResult | null {
  const record = cityReader.get(ip)
  const country = record?.country?.iso_code ?? null

  if (!country && fields.size === 0) return null

  const result: LookupResult = { ip, country }

  if (fields.has("city")) {
    result.city = record?.city?.names?.en ?? null
  }

  if (fields.has("continent")) {
    result.continent = record?.continent?.code ?? null
  }

  if (fields.has("subdivision")) {
    const sub = record?.subdivisions?.[0]
    result.subdivision = sub?.iso_code ?? null
  }

  if (fields.has("postal")) {
    result.postal = record?.postal?.code ?? null
  }

  if (fields.has("location")) {
    const loc = record?.location
    result.location = loc
      ? {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy_radius: loc.accuracy_radius,
          time_zone: loc.time_zone ?? null,
        }
      : null
  }

  if (fields.has("asn")) {
    const asnRecord = asnReader.get(ip)
    result.asn = asnRecord
      ? {
          number: asnRecord.autonomous_system_number,
          organization: asnRecord.autonomous_system_organization,
        }
      : null
  }

  return result
}
