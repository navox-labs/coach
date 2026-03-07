"use client";

import { useState, useRef, useEffect } from "react";
import { CoachingStep } from "@/lib/todoState";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  steps: CoachingStep[];
  onStepToggle: (stepId: string) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
}

const STEP_ICONS = ["🗺", "🎯", "✉️", "🔧"];

export default function CoachPanel({
  isOpen,
  onClose,
  steps,
  onStepToggle,
  messages,
  onSendMessage,
  isStreaming,
}: Props) {
  const [input, setInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: isMobile ? 0 : 24,
        right: isMobile ? 0 : 24,
        width: isMobile ? "100%" : 384,
        height: isMobile ? "100%" : 600,
        background: "var(--bg)",
        borderRadius: isMobile ? 0 : 16,
        boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
        border: isMobile ? "none" : "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1001,
        animation: "slide-up 0.25s ease",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-panel)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-primary)",
              letterSpacing: "0.03em",
            }}
          >
            Navox Coach
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "var(--text-muted)",
            padding: 4,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* TODO Steps */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-panel)",
          flexShrink: 0,
        }}
      >
        {steps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => onStepToggle(step.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "5px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: step.completed
                  ? "none"
                  : "1.5px solid var(--border-hi)",
                background: step.completed ? "var(--strong)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "#fff",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              {step.completed ? "✓" : ""}
            </span>
            <span style={{ fontSize: 12 }}>{STEP_ICONS[i]}</span>
            <span
              style={{
                fontSize: 12,
                color: step.completed
                  ? "var(--text-muted)"
                  : "var(--text-primary)",
                textDecoration: step.completed ? "line-through" : "none",
              }}
            >
              {step.label}
            </span>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius:
                  msg.role === "user"
                    ? "14px 14px 4px 14px"
                    : "14px 14px 14px 4px",
                background:
                  msg.role === "user" ? "var(--accent)" : "var(--bg-card)",
                color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
              {msg.role === "assistant" && isStreaming && i === messages.length - 1 && (
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 14,
                    background: "var(--accent)",
                    marginLeft: 2,
                    animation: "pulse-ring 1s infinite",
                    verticalAlign: "text-bottom",
                  }}
                />
              )}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 13,
              marginTop: 40,
            }}
          >
            Starting your coaching session...
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-panel)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          style={{
            flex: 1,
            opacity: isStreaming ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="btn btn-primary"
          style={{
            padding: "7px 14px",
            fontSize: 14,
            opacity: isStreaming || !input.trim() ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
