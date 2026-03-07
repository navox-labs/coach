export type RoleCategory =
  | "Self"
  | "Engineers/Devs"
  | "Founders/CEOs"
  | "Recruiters"
  | "AI/ML/Data"
  | "Leadership"
  | "Design/Product"
  | "Advisors"
  | "Other";

export interface Connection {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  connectedOn: string;
  email?: string;
  tieStrength: number;
  tieCategory: "strong" | "moderate" | "weak" | "dormant";
  roleCategory: RoleCategory;
  daysSinceConnected: number;
  isBridge: boolean;
  activationPriority: number;
}

export interface GapItem {
  category: RoleCategory;
  currentCount: number;
  currentPct: number;
  idealPct: number;
  deficit: number;
  severity: "critical" | "moderate" | "minor";
  suggestion: string;
}

export interface GapAnalysis {
  totalConnections: number;
  avgTieStrength: number;
  bridgingCapitalScore: number;
  bondingCapitalScore: number;
  roleDistribution: Record<RoleCategory, number>;
  rolePercentages: Record<RoleCategory, number>;
  gaps: GapItem[];
  topActivationTargets: Connection[];
  networkHealthScore: number;
  interpretation: string;
}

export interface StoredNetworkData {
  connections: Connection[];
  gapAnalysis: GapAnalysis;
  uploadedAt: string;
}
