import { useRef, useState } from "react";
import Icon from "./Icon";

const VIEW = 264; // square viewport (px)
const OUT = 512; // output size (px)

export default function ImageCropper({
  src,
  onDone,
  onClose,
}: {
  src: string;
  onDone: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const baseScale = nat.w ? Math.max(VIEW / nat.w, VIEW / nat.h) : 1;
  const scale = baseScale * zoom;
  const dispW = nat.w * scale;
  const dispH = nat.h * scale;

  function clamp(x: number, y: number) {
    const minX = VIEW - dispW;
    const minY = VIEW - dispH;
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    };
  }

  function onLoad() {
    const el = imgRef.current!;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    setNat({ w, h });
    const s = Math.max(VIEW / w, VIEW / h);
    setOffset({ x: (VIEW - w * s) / 2, y: (VIEW - h * s) / 2 });
  }

  function onZoom(z: number) {
    setZoom(z);
    // Re-clamp keeping the current center.
    const newScale = baseScale * z;
    const cx = (VIEW / 2 - offset.x) / scale;
    const cy = (VIEW / 2 - offset.y) / scale;
    const nx = VIEW / 2 - cx * newScale;
    const ny = VIEW / 2 - cy * newScale;
    const cl = {
      x: Math.min(0, Math.max(VIEW - nat.w * newScale, nx)),
      y: Math.min(0, Math.max(VIEW - nat.h * newScale, ny)),
    };
    setOffset(cl);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setOffset(clamp(drag.current.ox + dx, drag.current.oy + dy));
  }
  function onPointerUp() {
    drag.current = null;
  }

  function save() {
    const el = imgRef.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d")!;
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sSize = VIEW / scale;
    ctx.drawImage(el, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
    onDone(canvas.toDataURL("image/jpeg", 0.9));
  }

  return (
    <div className="sheet-backdrop" style={{ alignItems: "center" }}>
      <div
        style={{
          background: "var(--bg)", borderRadius: 18, padding: 20,
          width: "calc(100% - 32px)", maxWidth: 340, textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Cadrer la photo</h2>
        <div
          style={{
            width: VIEW, height: VIEW, maxWidth: "100%", margin: "0 auto",
            borderRadius: "50%", overflow: "hidden", position: "relative",
            background: "var(--surface-2)", touchAction: "none", cursor: "grab",
            border: "0.5px solid var(--line)",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            onLoad={onLoad}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: offset.x, top: offset.y,
              width: dispW || undefined, height: dispH || undefined,
              maxWidth: "none", userSelect: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 4px 4px" }}>
          <Icon name="search" size={16} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => onZoom(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>

        <button className="btn primary block" style={{ marginTop: 14 }} onClick={save}>
          Enregistrer la photo
        </button>
        <button className="btn ghost block" style={{ marginTop: 4, color: "var(--muted)" }} onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  );
}
