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
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 30% 50%, #0d1f3c 0%, #060d1a 60%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, fontFamily: "system-ui,sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📈</div>
          <div style={{ color: "#e2e8f0", fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Stock Analyzer Pro</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>AI analýzy akcií · DCF · Buffett checklist</div>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#3b82f6",
              colorBackground: "#0f172a",
              colorText: "#f1f5f9",
              colorTextSecondary: "#94a3b8",
              colorInputBackground: "#1e293b",
              colorInputText: "#f1f5f9",
              colorNeutral: "#94a3b8",
              borderRadius: "12px",
              fontSize: "15px",
            },
            elements: {
              card: {
                background: "#0f172a",
                border: "1px solid #1e3a5f",
                boxShadow: "0 25px 60px #00000090",
                padding: "28px",
              },
              headerTitle: { color: "#f1f5f9", fontSize: "18px", fontWeight: "800" },
              headerSubtitle: { color: "#64748b" },
              socialButtonsBlockButton: {
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#f1f5f9",
                fontWeight: "600",
              },
              socialButtonsBlockButtonText: { color: "#f1f5f9" },
              socialButtonsProviderIcon: { filter: "brightness(1.2)" },
              dividerLine: { background: "#1e3a5f" },
              dividerText: { color: "#475569" },
              formFieldLabel: { color: "#94a3b8" },
              formFieldInput: {
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#f1f5f9",
              },
              footerActionLink: { color: "#3b82f6" },
              identityPreviewText: { color: "#94a3b8" },
              identityPreviewEditButton: { color: "#3b82f6" },
              formButtonPrimary: {
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                fontWeight: "700",
              },
            },
          }}
          routing="hash"
        />
        <div style={{ color: "#334155", fontSize: 11, textAlign: "center" }}>
          Přístup pouze na pozvání administrátora
        </div>
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
