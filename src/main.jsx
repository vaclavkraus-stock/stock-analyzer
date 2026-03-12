if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.muted, fontSize: 14 }}>Načítání...</div>
      </div>
    );
  }
 
  if (!isSignedIn) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
          <div style={{ color: C.text, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Stock Analyzer Pro</div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Přihlaste se pro přístup k analýzám</div>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: C.blue,
              colorBackground: C.card,
              colorText: C.text,
              colorTextSecondary: C.muted,
              colorInputBackground: "#0f1e35",
              colorInputText: C.text,
              borderRadius: "12px",
            },
            elements: {
              card: { border: `1px solid ${C.border}`, boxShadow: "0 20px 60px #00000080" },
              headerTitle: { display: "none" },
              headerSubtitle: { display: "none" },
              footer: { background: "transparent" },
            },
          }}
          routing="hash"
        />
        <div style={{ color: C.muted, fontSize: 11, textAlign: "center", maxWidth: 280 }}>
          Přístup je pouze na pozvání. Po přihlášení čeká na schválení administrátorem.
        </div>
      </div>
    );
  }
 
  return <App />;
}
 
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AuthGate />
    </ClerkProvider>
  </StrictMode>
);
 
