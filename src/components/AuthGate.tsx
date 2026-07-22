import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSyncConfigured } from "../lib/supabase";
import { startSync } from "../lib/sync";
import { migrateAttachments } from "../lib/storage";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  // Local-only mode: no project connected yet — run the app as-is.
  if (!isSyncConfigured || !supabase) return <>{children}</>;
  return <AuthedApp>{children}</AuthedApp>;
}

function AuthedApp({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && !synced) {
      startSync()
        .then(() => migrateAttachments())
        .finally(() => setSynced(true));
    }
  }, [session, synced]);

  if (!ready) return null;
  if (!session) return <Login />;
  return <>{children}</>;
}

function frError(m: string): string {
  const s = m.toLowerCase();
  if (s.includes("invalid login")) return "Email ou mot de passe incorrect.";
  if (s.includes("already registered") || s.includes("already been registered"))
    return "Ce compte existe déjà — connecte-toi.";
  if (s.includes("at least") || s.includes("password should"))
    return "Mot de passe : au moins 6 caractères.";
  if (s.includes("email not confirmed"))
    return "Email non confirmé — désactive « Confirm email » dans Supabase.";
  return m;
}

function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function google() {
    setError("");
    setInfo("");
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  async function submit() {
    const em = email.trim();
    if (!em || !password) return;
    setLoading(true);
    setError("");
    setInfo("");
    if (mode === "signin") {
      const { error } = await supabase!.auth.signInWithPassword({ email: em, password });
      if (error) setError(frError(error.message));
    } else {
      const { data, error } = await supabase!.auth.signUp({ email: em, password });
      if (error) setError(frError(error.message));
      else if (!data.session)
        setInfo("Compte créé. La confirmation par email est encore activée dans Supabase — désactive « Confirm email », puis connecte-toi.");
    }
    setLoading(false);
  }

  return (
    <div className="page" style={{ maxWidth: 360, margin: "0 auto", paddingTop: 56, textAlign: "center" }}>
      <img
        src="/pwa-512.png"
        alt="Capitaine"
        width={88}
        height={88}
        style={{
          borderRadius: 24, marginBottom: 18,
          boxShadow: "var(--shadow)", border: "1px solid var(--glass-brd)",
        }}
      />
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Capitaine</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        {mode === "signin" ? "Connecte-toi pour retrouver Capitaine." : "Crée ton compte (une seule fois)."}
      </p>

      <button
        className="btn block"
        style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", height: 46 }}
        onClick={google}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continuer avec Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span style={{ fontSize: 12, color: "var(--faint)" }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>

      <div className="field" style={{ marginTop: 0, textAlign: "left" }}>
        <label>Adresse email</label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="prenom@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field" style={{ textAlign: "left" }}>
        <label>Mot de passe</label>
        <input
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder={mode === "signup" ? "au moins 6 caractères" : "••••••••"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{error}</p>}
      {info && <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{info}</p>}

      <button className="btn primary block" style={{ marginTop: 16 }} onClick={submit} disabled={loading}>
        {loading ? "…" : mode === "signin" ? "Se connecter" : "Créer le compte"}
      </button>

      <button
        className="btn ghost block"
        style={{ marginTop: 8, color: "var(--muted)" }}
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}
      >
        {mode === "signin" ? "Première fois ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>
    </div>
  );
}
