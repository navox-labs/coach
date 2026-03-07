import { StoredNetworkData } from "./types";

export function loadNetworkData(): StoredNetworkData | null {
  try {
    const raw = localStorage.getItem("navox-network-data");
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredNetworkData;
    if (!stored.connections?.length) return null;
    return stored;
  } catch {
    return null;
  }
}

export function clearCoachData() {
  localStorage.removeItem("navox-coach-progress");
  localStorage.removeItem("navox-coach-seen");
  localStorage.removeItem("navox-coach-messages");
}
