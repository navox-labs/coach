export default function Home() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Navox Coach API
        </h1>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
          This is the API backend for Navox Coach.
          The coaching interface is embedded in the{" "}
          <a href="https://www.navox.tech/network" style={{ color: "#6c4bf4" }}>
            Network tool
          </a>.
        </p>
      </div>
    </div>
  );
}
