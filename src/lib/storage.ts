import { supabase, isSyncConfigured } from "./supabase";
import { uid, getData, update } from "./store";
import type { Attachment, AppData, Profile } from "./types";

const BUCKET = "attachments";

/** URL affichable d'une pièce jointe (nouveau lien Storage, ou ancien base64). */
export function attachmentSrc(a: Attachment): string {
  return a.url || a.dataUrl || "";
}

/** URL de la photo du profil (lien Storage, ou ancien base64). */
export function photoSrc(p: Pick<Profile, "photoUrl" | "photoDataUrl">): string | undefined {
  return p.photoUrl || p.photoDataUrl || undefined;
}

function extFor(name: string, type: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  if (m) return m[1].toLowerCase();
  if (type.includes("pdf")) return "pdf";
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";
  return "bin";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/** Redimensionne/compresse une image (les PDF passent tels quels). */
async function compress(file: Blob, type: string): Promise<{ blob: Blob; type: string }> {
  if (!type.startsWith("image/")) return { blob: file, type };
  try {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    const maxDim = 1600;
    let w = img.width, h = img.height;
    if (Math.max(w, h) > maxDim) {
      const s = maxDim / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")?.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.82));
    if (blob && blob.size < file.size) return { blob, type: "image/jpeg" };
  } catch {
    /* garde l'original */
  }
  return { blob: file, type };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const type = head.match(/data:(.*?);/)?.[1] || "application/octet-stream";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}

async function uploadBlob(path: string, blob: Blob, contentType: string): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType, upsert: true });
  if (error) {
    console.warn("Storage : upload impossible", error.message);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Fichier choisi → pièce jointe uploadée dans Storage (ou base64 en secours). */
export async function fileToAttachment(file: File): Promise<Attachment> {
  const id = uid();
  const { blob, type } = await compress(file, file.type || "application/octet-stream");
  if (isSyncConfigured && supabase) {
    const path = `${id}.${extFor(file.name, type)}`;
    const url = await uploadBlob(path, blob, type);
    if (url) return { id, name: file.name, type, url, path };
  }
  return { id, name: file.name, type, dataUrl: await blobToDataUrl(blob) };
}

/** Upload d'un dataUrl (photo recadrée) → {url, path}, ou null (on garde le dataUrl). */
export async function uploadDataUrl(dataUrl: string, baseName: string): Promise<{ url: string; path: string } | null> {
  if (!isSyncConfigured || !supabase) return null;
  const blob = dataUrlToBlob(dataUrl);
  const path = `${uid()}.${extFor(baseName, blob.type)}`;
  const url = await uploadBlob(path, blob, blob.type);
  return url ? { url, path } : null;
}

type WithAttachments = { attachments?: Attachment[] };
const ATTACHMENT_ARRAYS = ["health", "appointments", "expenses", "careEvents", "treatments"] as const;

/** Migration unique : bascule les pièces jointes base64 + la photo vers Storage. */
let migrated = false;
export async function migrateAttachments(): Promise<void> {
  if (migrated || !isSyncConfigured || !supabase) return;
  migrated = true;

  const data = getData();
  const patches: { id: string; url: string; path: string }[] = [];

  for (const key of ATTACHMENT_ARRAYS) {
    for (const item of (data[key] as unknown as WithAttachments[]) ?? []) {
      for (const a of item.attachments ?? []) {
        if (a.dataUrl && !a.url) {
          try {
            const blob = dataUrlToBlob(a.dataUrl);
            const path = `${a.id}.${extFor(a.name, blob.type)}`;
            const url = await uploadBlob(path, blob, blob.type);
            if (url) patches.push({ id: a.id, url, path });
          } catch {
            /* skip */
          }
        }
      }
    }
  }

  let photoPatch: { url: string; path: string } | null = null;
  if (data.profile?.photoDataUrl && !data.profile.photoUrl) {
    photoPatch = await uploadDataUrl(data.profile.photoDataUrl, "capitaine.jpg");
  }

  if (!patches.length && !photoPatch) return;

  update((d: AppData) => {
    for (const key of ATTACHMENT_ARRAYS) {
      for (const item of d[key] as unknown as WithAttachments[]) {
        if (!item.attachments) continue;
        item.attachments = item.attachments.map((a) => {
          const p = patches.find((x) => x.id === a.id);
          return p ? { id: a.id, name: a.name, type: a.type, url: p.url, path: p.path } : a;
        });
      }
    }
    if (photoPatch && d.profile) {
      d.profile.photoUrl = photoPatch.url;
      d.profile.photoDataUrl = undefined;
    }
  });
}
