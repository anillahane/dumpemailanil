import { useSyncExternalStore } from "react";
import {
  MOCK_OBSERVATIONS,
  ObservationRecord,
  ObservationStatusEvent,
} from "@/data/mockData";

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const subscribeObservations = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const getObservation = (issueId: string): ObservationRecord | undefined =>
  MOCK_OBSERVATIONS.find((o) => o.issueId === issueId);

export const getObservationsSnapshot = (): ObservationRecord[] => MOCK_OBSERVATIONS;

export const updateObservation = (
  issueId: string,
  patch: Partial<ObservationRecord>,
  historyEntry?: ObservationStatusEvent,
) => {
  const idx = MOCK_OBSERVATIONS.findIndex((o) => o.issueId === issueId);
  if (idx < 0) return;
  const cur = MOCK_OBSERVATIONS[idx];
  MOCK_OBSERVATIONS[idx] = {
    ...cur,
    ...patch,
    statusHistory: historyEntry
      ? [...(cur.statusHistory ?? []), historyEntry]
      : (patch.statusHistory ?? cur.statusHistory),
  };
  notify();
};

export const useObservation = (issueId: string): ObservationRecord | undefined => {
  return useSyncExternalStore(
    subscribeObservations,
    () => getObservation(issueId),
    () => getObservation(issueId),
  );
};