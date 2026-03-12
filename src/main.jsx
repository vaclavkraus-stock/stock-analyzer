import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider, SignIn, useAuth, useUser, UserButton } from "@clerk/clerk-react";
import App from "./App.jsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// Seznam schválených emailů – přidej do Vercelu jako VITE_APPROVED_EMAILS
// Formát: "email1@gmail.com,email2@gmail.com"


const C = {
  bg: "#060d1a",
  card: "#0b1628",
  card2: "#0f1e35",
  border: "#1a2d4a",
  text: "#e2e8f0",
  muted: "#4e6080",
  blue: "#3b82f6",
  green: "#10b981",
  red: "#ef4444",
};

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.muted, fontSize: 14 }}>Načítání...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, fontFamily: "system-ui,sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
          <div style={{ color: C.text, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>Stock Analyzer Pro</div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Přihlaste se pro přístup k analýzám</div>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: C.blue,
              colorBackground: C.card,
              colorText: C.text,
              colorTextSecondary: C.muted,
              colorInputBackground: C.card2,
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
      </div>
    );
  }

  // Zkontroluj Clerk Public Metadata – approved: true
  const isApproved = user?.publicMetadata?.approved === true;

  if (!isApproved) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "system-ui,sans-serif" }}>
        <div style={{ fontSize: 48 }}>⏳</div>
        <div style={{ color: C.text, fontSize: 20, fontWeight: 800 }}>Čekáte na schválení</div>
        <div style={{ color: C.muted, fontSize: 13, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
          Váš účet <strong style={{ color: C.blue }}>{user?.primaryEmailAddress?.emailAddress}</strong> čeká na schválení administrátorem. Brzy se vám ozveme.
        </div>
        <div style={{ marginTop: 8 }}>
          <UserButton afterSignOutUrl="/" />
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
