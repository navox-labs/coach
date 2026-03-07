"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface Props {
  stepId: string | null;
  onDismiss: () => void;
}

const REWARD_MESSAGES: Record<string, string> = {
  debrief: "You understand your network now. Knowledge is power. 🗺",
  opportunities: "You can see the paths. Now let's walk one. 🎯",
  outreach: "That message could change everything. Seriously. ✉️",
  gaps: "You've got a plan to build the network you need. 🔧",
};

export default function StepReward({ stepId, onDismiss }: Props) {
  const timerRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!stepId) return;

    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7, x: 0.5 },
      colors: ["#6c4bf4", "#16a36b", "#6366f1", "#d9960a"],
    });

    // Auto-dismiss after 3 seconds
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stepId, onDismiss]);

  if (!stepId) return null;

  const message = REWARD_MESSAGES[stepId] || "Step complete! 🎉";

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2000,
        background: "var(--bg)",
        border: "1px solid var(--border-hi)",
        borderRadius: 16,
        padding: "32px 40px",
        textAlign: "center",
        boxShadow: "0 16px 64px rgba(0,0,0,0.15)",
        animation: "slide-up 0.3s ease",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontSize: 48,
          marginBottom: 12,
          animation: "check-pop 0.4s ease",
        }}
      >
        🎉
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 6,
        }}
      >
        Step complete!
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
    </div>
  );
}
