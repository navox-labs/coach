"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { loadNetworkData, clearCoachData } from "@/lib/storage";
import { buildAgentContext, AgentContext } from "@/lib/agentContext";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { loadStepProgress, saveStepProgress, CoachingStep } from "@/lib/todoState";
import { StoredNetworkData } from "@/lib/types";
import NoDataScreen from "@/components/NoDataScreen";
import CoachBubble from "@/components/CoachBubble";
import CoachPanel from "@/components/CoachPanel";
import StepReward from "@/components/StepReward";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [networkData, setNetworkData] = useState<StoredNetworkData | null>(null);
  const [agentContext, setAgentContext] = useState<AgentContext | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [steps, setSteps] = useState<CoachingStep[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [completedStepId, setCompletedStepId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const initialSent = useRef(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const data = loadNetworkData();
    if (data) {
      setNetworkData(data);
      const ctx = buildAgentContext(data.connections, data.gapAnalysis);
      setAgentContext(ctx);
      setSystemPrompt(buildSystemPrompt(ctx));
      setSteps(loadStepProgress());

      // Load saved messages
      try {
        const savedMessages = localStorage.getItem("navox-coach-messages");
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        }
      } catch {}
    }
    setLoaded(true);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("navox-coach-messages", JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!systemPrompt || isStreaming) return;

      const userMessage: ChatMessage = { role: "user", content: text };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      try {
        const res = await fetch("/coach/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            systemPrompt,
          }),
        });

        if (!res.ok) throw new Error("API request failed");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let assistantContent = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
          const content = assistantContent;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content };
            return updated;
          });
        }

        if (!panelOpen) {
          setHasNotification(true);
        }
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [systemPrompt, isStreaming, messages, panelOpen]
  );

  // Auto-trigger initial coaching message on first panel open
  const handlePanelOpen = useCallback(() => {
    setPanelOpen(true);
    setHasNotification(false);
    if (messages.length === 0 && !initialSent.current) {
      initialSent.current = true;
      const init = async () => {
        setIsStreaming(true);
        try {
          const initMessages: ChatMessage[] = [
            { role: "user", content: "Hi coach, I just uploaded my network. What should I know?" },
          ];
          setMessages(initMessages);

          const res = await fetch("/coach/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: initMessages,
              systemPrompt,
            }),
          });

          if (!res.ok) throw new Error("API request failed");
          const reader = res.body?.getReader();
          if (!reader) throw new Error("No reader");

          const decoder = new TextDecoder();
          let assistantContent = "";
          setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            assistantContent += decoder.decode(value, { stream: true });
            const content = assistantContent;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content };
              return updated;
            });
          }
        } catch (err) {
          console.error("Initial message error:", err);
        } finally {
          setIsStreaming(false);
        }
      };
      init();
    }
  }, [messages.length, systemPrompt]);

  const handleStepToggle = useCallback(
    (stepId: string) => {
      setSteps((prev) => {
        const updated = prev.map((s) =>
          s.id === stepId
            ? {
                ...s,
                completed: !s.completed,
                completedAt: !s.completed ? new Date().toISOString() : undefined,
              }
            : s
        );
        saveStepProgress(updated);

        const step = prev.find((s) => s.id === stepId);
        if (step && !step.completed) {
          setCompletedStepId(stepId);
        }

        return updated;
      });
    },
    []
  );

  const handleClearData = useCallback(() => {
    clearCoachData();
    localStorage.removeItem("navox-coach-messages");
    setMessages([]);
    setSteps(loadStepProgress());
    setPanelOpen(false);
    initialSent.current = false;
  }, []);

  if (!loaded) return null;
  if (!networkData || !agentContext) return <NoDataScreen />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 52,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-panel)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-secondary)",
              letterSpacing: "0.05em",
              fontWeight: 500,
            }}
          >
            NAVOX<span style={{ color: "var(--accent)" }}> COACH</span>
          </span>
        </div>

        {/* Stats */}
        <div
          className="hide-mobile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          <StatItem
            label="connections"
            value={agentContext.networkSummary.totalConnections}
          />
          <StatItem
            label="health"
            value={`${agentContext.networkSummary.networkHealthScore}%`}
            color={
              agentContext.networkSummary.networkHealthScore > 60
                ? "var(--strong)"
                : agentContext.networkSummary.networkHealthScore > 35
                ? "var(--moderate)"
                : "var(--critical)"
            }
          />
          <StatItem
            label="bridging"
            value={`${Math.round(agentContext.networkSummary.bridgingCapitalScore * 100)}%`}
            color="var(--weak)"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href="https://www.navox.tech/network"
            className="btn btn-ghost"
            style={{
              fontSize: 11,
              padding: "4px 12px",
              height: 28,
              textDecoration: "none",
            }}
          >
            ← Network
          </a>
          <button
            className="btn btn-ghost"
            onClick={handleClearData}
            style={{ fontSize: 11, padding: "4px 12px", height: 28 }}
          >
            Clear data
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 52px)",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Your network coach is ready.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: 24,
            }}
          >
            Click the coach button to start your personalized coaching session.
            We&apos;ll walk through your network together — one step at a time.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {steps.map((step) => (
              <div
                key={step.id}
                style={{
                  padding: "8px 14px",
                  background: step.completed ? "rgba(22,163,107,0.08)" : "var(--bg-card)",
                  border: `1px solid ${step.completed ? "var(--strong)" : "var(--border)"}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: step.completed ? "var(--strong)" : "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {step.completed ? "✓" : "○"} {step.label}
              </div>
            ))}
          </div>
        </div>
      </main>

      <CoachBubble
        onClick={handlePanelOpen}
        hasNotification={hasNotification}
        panelOpen={panelOpen}
      />

      <CoachPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        steps={steps}
        onStepToggle={handleStepToggle}
        messages={messages}
        onSendMessage={sendMessage}
        isStreaming={isStreaming}
      />

      <StepReward
        stepId={completedStepId}
        onDismiss={() => setCompletedStepId(null)}
      />
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <span
        style={{
          color: color || "var(--text-primary)",
          fontWeight: 500,
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          color: "var(--text-muted)",
          fontSize: 10,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}
