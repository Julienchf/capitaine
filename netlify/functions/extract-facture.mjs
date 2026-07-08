// Netlify Function — extraction des champs d'une facture (PDF ou photo) via Gemini.
// La clé API vit UNIQUEMENT ici (variable d'env Netlify GEMINI_API_KEY), jamais dans l'app.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

// Ce que Gemini doit renvoyer — un JSON strict.
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

const PROMPT = `Tu analyses une facture (ou un ticket / une photo de facture) liée à un chien, en français.
Extrais les informations demandées et renvoie-les au format JSON demandé.
Règles :
- « amount » = le TOTAL réellement payé, TTC, en euros (nombre décimal, sans symbole).
- « date » = la date d'émission de la facture au format AAAA-MM-JJ. Si plusieurs dates, prends celle de la facture.
- « category » = classe selon le CONTENU acheté, pas selon l'émetteur : consultation/vaccin/médicament/soin vétérinaire → « veto » ; croquettes/pâtée/aliment → « nourriture » ; friandises/récompenses → « friandises » ; toilettage/épilation → « toilettage » ; garde du chien → « dogsitting ». Exemple : des croquettes achetées chez le vétérinaire = « nourriture » (pas « veto »). Si la facture mélange plusieurs types, prends la catégorie du poste le plus important.
- « careType » = « antiparasite », « vermifuge » ou « epilation » seulement si la facture porte clairement sur ce soin récurrent ; sinon « none ».
- « medications » = liste les médicaments avec leur posologie si indiquée ; laisse vide s'il n'y en a pas.
- Si une information est absente, laisse le champ vide (ou 0 pour le montant). N'invente jamais.`;

export default async (req) => {
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
  const { fileBase64, mimeType } = body || {};
  if (!fileBase64 || !mimeType) {
    return json({ ok: false, error: "Fichier manquant." }, 400);
  }

  const payload = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: fileBase64 } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0,
    },
  };

  let gRes;
  try {
    gRes = await fetch(ENDPOINT(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return json({ ok: false, error: "Impossible de joindre Gemini : " + (e?.message || e) }, 502);
  }

  if (!gRes.ok) {
    const detail = await gRes.text().catch(() => "");
    return json({ ok: false, error: `Gemini a renvoyé ${gRes.status}`, detail: detail.slice(0, 500) }, 502);
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
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
