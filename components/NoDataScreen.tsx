"use client";

export default function NoDataScreen() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 420,
          padding: "48px 32px",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderRadius: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Your network map isn&apos;t loaded yet.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          To start coaching, first upload your LinkedIn connections at{" "}
          <strong>navox.tech/network</strong>. Your data stays in your browser
          — the coach reads it automatically.
        </p>
        <a
          href="https://www.navox.tech/network"
          className="btn btn-primary"
          style={{
            padding: "10px 24px",
            fontSize: 14,
            textDecoration: "none",
            borderRadius: 8,
          }}
        >
          Go to Network Tool →
        </a>
      </div>
    </div>
  );
}
