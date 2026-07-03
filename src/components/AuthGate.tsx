import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSyncConfigured } from "../lib/supabase";
import { startSync } from "../lib/sync";
import Icon from "./Icon";

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
      startSync().finally(() => setSynced(true));
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
      <div
        style={{
          width: 72, height: 72, borderRadius: 20, background: "var(--accent)", color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
        }}
      >
        <Icon name="paw" size={40} />
      </div>
      <h1 style={{ fontSize: 26 }}>Capitaine</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        {mode === "signin" ? "Connecte-toi pour retrouver Capitaine." : "Crée ton compte (une seule fois)."}
      </p>

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
