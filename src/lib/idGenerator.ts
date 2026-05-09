// Central ID generation engine. Configuration is admin-managed and persisted
// in localStorage so it can be edited from the Admin → ID Settings panel
// without touching code.

export type IdEntity = "checkpoint" | "observation" | "audit" | "issue";

export interface IdConfig {
  entity: IdEntity;
  label: string;
  prefix: string;
  separator: string;
  padding: number;
  start: number;
  next: number;
  suffix?: "none" | "year" | "yearmonth";
}

const STORAGE_KEY = "ams.idConfigs.v1";

export const DEFAULT_ID_CONFIGS: Record<IdEntity, IdConfig> = {
  checkpoint:  { entity: "checkpoint",  label: "Checkpoint ID",  prefix: "CHK", separator: "-", padding: 3, start: 1, next: 1, suffix: "none" },
  observation: { entity: "observation", label: "Observation ID", prefix: "OBS", separator: "-", padding: 4, start: 1, next: 1, suffix: "year" },
  issue:       { entity: "issue",       label: "Issue ID",       prefix: "ISS", separator: "-", padding: 6, start: 1, next: 1, suffix: "none" },
  audit:       { entity: "audit",       label: "Audit ID",       prefix: "AUD", separator: "-", padding: 5, start: 1, next: 1, suffix: "year" },
};

const readStore = (): Record<IdEntity, IdConfig> => {
  if (typeof window === "undefined") return { ...DEFAULT_ID_CONFIGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ID_CONFIGS };
    const parsed = JSON.parse(raw) as Partial<Record<IdEntity, IdConfig>>;
    return { ...DEFAULT_ID_CONFIGS, ...parsed };
  } catch {
    return { ...DEFAULT_ID_CONFIGS };
  }
};

const writeStore = (data: Record<IdEntity, IdConfig>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getIdConfigs = (): Record<IdEntity, IdConfig> => readStore();

export const getIdConfig = (entity: IdEntity): IdConfig => readStore()[entity];

export const saveIdConfig = (cfg: IdConfig) => {
  const all = readStore();
  all[cfg.entity] = cfg;
  writeStore(all);
};

export const resetIdConfig = (entity: IdEntity) => {
  const all = readStore();
  all[entity] = { ...DEFAULT_ID_CONFIGS[entity] };
  writeStore(all);
};

export const resetCounter = (entity: IdEntity) => {
  const all = readStore();
  all[entity] = { ...all[entity], next: all[entity].start };
  writeStore(all);
};

const suffixToken = (suffix: IdConfig["suffix"]): string => {
  const d = new Date();
  switch (suffix) {
    case "year": return String(d.getFullYear());
    case "yearmonth": return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    default: return "";
  }
};

export const formatId = (cfg: IdConfig, sequence: number): string => {
  const seq = String(sequence).padStart(cfg.padding, "0");
  const suffix = suffixToken(cfg.suffix);
  const parts = [cfg.prefix, seq];
  if (suffix) parts.push(suffix);
  return parts.filter(Boolean).join(cfg.separator);
};

/**
 * Generate the next ID for an entity and persist the incremented counter.
 * This is the only function components should call when creating a new row.
 */
export const generateId = (entity: IdEntity): string => {
  const all = readStore();
  const cfg = all[entity];
  const id = formatId(cfg, cfg.next);
  all[entity] = { ...cfg, next: cfg.next + 1 };
  writeStore(all);
  return id;
};

/** Preview without consuming a sequence number. */
export const previewId = (cfg: IdConfig): string => formatId(cfg, cfg.next);
