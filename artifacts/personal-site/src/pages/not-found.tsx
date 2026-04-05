export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        background: "hsl(45 30% 97%)",
        color: "hsl(20 10% 12%)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px", color: "hsl(20 8% 50%)" }}>
          404
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 400, marginBottom: "12px" }}>Page not found</h1>
        <a
          href="/"
          style={{ fontSize: "0.95rem", color: "hsl(20 10% 30%)", textDecoration: "underline", textUnderlineOffset: "4px" }}
        >
          Return home
        </a>
      </div>
    </div>
  );
}
