import Icon from "./Icon";

export default function EventCard({
  title,
  dateLabel,
  extra,
  onClick,
}: {
  title: string;
  dateLabel: string;
  extra?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="card card-pad"
      style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 8, minHeight: 92 }}
      onClick={onClick}
    >
      <div style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }}>{title}</div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="calendar" size={13} /> {dateLabel}
        </span>
        {extra}
      </div>
    </button>
  );
}
