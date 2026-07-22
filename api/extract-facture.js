// Vercel Edge Function — extraction des champs d'une facture (PDF ou photo) via Gemini.
// La clé API vit UNIQUEMENT ici (variable d'env Vercel GEMINI_API_KEY), jamais dans l'app.
export const config = { runtime: "edge" };

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    date: { type: "string", description: "Date de la facture au format AAAA-MM-JJ. Vide si introuvable." },
    amount: { type: "number", description: "Montant total TTC payé, en euros (nombre seul)." },
    category: {
      type: "string",
      enum: ["veto", "nourriture", "friandises", "hygiene", "accessoires", "toilettage", "dogsitting", "assurance", "autre"],
      description: "Catégorie de dépense la plus adaptée.",
    },
    label: { type: "string", description: "Libellé court et clair de la dépense (ex. « Consultation + vaccin CHPPiL »)." },
    vendor: { type: "string", description: "Nom du professionnel/commerce émetteur (clinique, pharmacie, magasin)." },
    careType: {
      type: "string",
      enum: ["epilation", "antiparasite", "vermifuge", "none"],
      description: "Si la facture concerne un soin récurrent, lequel ; sinon « none ».",
    },
    medications: { type: "string", description: "Médicaments/traitements mentionnés, avec posologie si présente. Vide sinon." },
    summary: { type: "string", description: "Résumé en une phrase de ce que couvre la facture." },
  },
  required: ["amount", "date", "category", "label"],
};

const PROMPT = `Tu analyses un ou plusieurs documents (facture, ticket, ordonnance, photo) concernant UNE MÊME dépense ou UN MÊME événement lié à un chien, en français. S'il y a plusieurs pages/documents, combine-les en un seul résultat.
Extrais les informations demandées et renvoie-les au format JSON demandé.
Règles :
- « amount » = le TOTAL réellement payé, TTC, en euros (nombre décimal, sans symbole).
- « date » = la date d'émission de la facture au format AAAA-MM-JJ. Si plusieurs dates, prends celle de la facture.
- « category » = classe selon le CONTENU acheté, pas selon l'émetteur : consultation/vaccin/médicament/soin vétérinaire → « veto » ; croquettes/pâtée/aliment → « nourriture » ; friandises/récompenses → « friandises » ; toilettage/épilation → « toilettage » ; garde du chien → « dogsitting ». Exemple : des croquettes achetées chez le vétérinaire = « nourriture » (pas « veto »). Si la facture mélange plusieurs types, prends la catégorie du poste le plus important.
- « careType » = « antiparasite », « vermifuge » ou « epilation » seulement si la facture porte clairement sur ce soin récurrent ; sinon « none ».
- « medications » = liste les médicaments avec leur posologie si indiquée ; laisse vide s'il n'y en a pas.
- Si une information est absente, laisse le champ vide (ou 0 pour le montant). N'invente jamais.`;

export default async function handler(req) {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Méthode non autorisée" }, 405);
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return json({ ok: false, error: "Clé API Gemini absente côté serveur (GEMINI_API_KEY)." }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Corps de requête invalide." }, 400);
  }
  let docs = [];
  if (Array.isArray(body?.files) && body.files.length) docs = body.files;
  else if (body?.fileBase64 && body?.mimeType) docs = [{ fileBase64: body.fileBase64, mimeType: body.mimeType }];
  docs = docs.filter((d) => d && d.fileBase64 && d.mimeType);
  if (!docs.length) {
    return json({ ok: false, error: "Fichier manquant." }, 400);
  }

  const parts = docs.map((d) => ({ inline_data: { mime_type: d.mimeType, data: d.fileBase64 } }));
  parts.push({ text: PROMPT });

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0,
    },
  };

  // Call Gemini, retrying a few times on transient overload (429/503).
  let gRes;
  let lastDetail = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      gRes = await fetch(ENDPOINT(key), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      return json({ ok: false, error: "Impossible de joindre Gemini : " + (e?.message || e) }, 502);
    }
    if (gRes.ok) break;
    lastDetail = (await gRes.text().catch(() => "")).slice(0, 800);
    // 503 = surcharge passagère → on réessaie. 429 = quota atteint → réessayer
    // n'aide pas (ça consomme encore le quota), on s'arrête et on informe.
    if (gRes.status === 503) {
      await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      continue;
    }
    break;
  }

  if (!gRes || !gRes.ok) {
    const status = gRes?.status ?? 0;
    let msg;
    if (status === 429) {
      const secs = retrySeconds(lastDetail);
      msg = `Trop de scans d'affilée : la limite gratuite de l'IA est atteinte. Réessaie ${secs ? `dans ~${secs} s` : "dans une minute"}.`;
    } else if (status === 503) {
      msg = "Le service d'analyse est momentanément surchargé, réessaie dans un instant.";
    } else {
      msg = `L'analyse a échoué (code ${status}).`;
    }
    return json({ ok: false, error: msg, detail: lastDetail }, 502);
  }

  const data = await gRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return json({ ok: false, error: "Réponse Gemini vide ou bloquée." }, 502);
  }

  let fields;
  try {
    fields = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "Réponse Gemini non-JSON." }, 502);
  }

  return json({ ok: true, fields });
}

// Extrait le délai de réessai conseillé par Gemini ("retryDelay":"25s" ou "retry in 25.8s").
function retrySeconds(detail) {
  const m = detail.match(/retryDelay["':\s]+(\d+(?:\.\d+)?)s/i) || detail.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  return m ? Math.ceil(Number(m[1])) : null;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
