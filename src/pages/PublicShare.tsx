import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { AppData } from "../lib/types";
import SharedCard from "../components/SharedCard";
import Icon from "../components/Icon";

export default function PublicShare() {
  const { token } = useParams();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    (async () => {
      if (!supabase || !token) return setState("error");
      const { data: row, error } = await supabase
        .from("shares")
        .select("data")
        .eq("id", token)
        .maybeSingle();
      if (error || !row?.data) return setState("error");
      setData(row.data as AppData);
      setState("ok");
    })();
  }, [token]);

  if (state === "loading") {
    return <div className="page" style={{ paddingTop: 80, textAlign: "center", color: "var(--muted)" }}>Chargement…</div>;
  }

  if (state === "error" || !data) {
    return (
      <div className="page" style={{ paddingTop: 72, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--faint)", marginBottom: 14 }}>
          <Icon name="paw" size={34} />
        </div>
        <h1 style={{ fontSize: 22 }}>Lien indisponible</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>Ce lien de partage n'est plus valide ou a été révoqué.</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <h1>{data.profile?.name || "Capitaine"}</h1>
        <div className="sub">Fiche partagée · lecture seule</div>
      </div>
      <SharedCard data={data} />
      <div style={{ fontSize: 12.5, color: "var(--faint)", textAlign: "center", marginTop: 16, padding: "0 20px" }}>
        Fiche en lecture seule, partagée par les propriétaires de {data.profile?.name || "Capitaine"}.
      </div>
    </div>
  );
}
