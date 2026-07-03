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

function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await supabase!.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="page" style={{ maxWidth: 360, margin: "0 auto", paddingTop: 64, textAlign: "center" }}>
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
        Le carnet de bord partagé de Capitaine.
      </p>

      {sent ? (
        <div className="card card-pad" style={{ textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "var(--ok)" }}><Icon name="check" size={20} /></span>
            <strong style={{ fontSize: 15 }}>Lien envoyé</strong>
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            Ouvre l'email envoyé à <b>{email}</b> et clique sur le lien pour te connecter.
          </p>
        </div>
      ) : (
        <>
          <div className="field" style={{ marginTop: 0, textAlign: "left" }}>
            <label>Ton adresse email</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="prenom@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{error}</p>}
          <button className="btn primary block" style={{ marginTop: 16 }} onClick={send} disabled={loading}>
            {loading ? "Envoi…" : "Recevoir mon lien de connexion"}
          </button>
          <p style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 14, lineHeight: 1.5 }}>
            Pas de mot de passe : on t'envoie un lien magique par email.
          </p>
        </>
      )}
    </div>
  );
}
