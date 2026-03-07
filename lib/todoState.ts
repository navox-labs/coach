export interface CoachingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export const COACHING_STEPS: CoachingStep[] = [
  {
    id: "debrief",
    label: "Understand your network",
    description: "Learn what your graph is telling you",
    completed: false,
  },
  {
    id: "opportunities",
    label: "Map your opportunities",
    description: "See which roles your network unlocks",
    completed: false,
  },
  {
    id: "outreach",
    label: "Draft your first outreach",
    description: "Send a message to your top bridge connection",
    completed: false,
  },
  {
    id: "gaps",
    label: "Fill your network gaps",
    description: "Build bridges to new professional clusters",
    completed: false,
  },
];

export function saveStepProgress(steps: CoachingStep[]) {
  localStorage.setItem("navox-coach-progress", JSON.stringify(steps));
}

export function loadStepProgress(): CoachingStep[] {
  try {
    const raw = localStorage.getItem("navox-coach-progress");
    if (!raw) return COACHING_STEPS.map((s) => ({ ...s }));
    return JSON.parse(raw);
  } catch {
    return COACHING_STEPS.map((s) => ({ ...s }));
  }
}
