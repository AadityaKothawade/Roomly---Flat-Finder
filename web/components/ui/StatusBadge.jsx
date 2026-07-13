const STYLES = {
  pending: "badge-brass",
  accepted: "badge-moss",
  declined: "badge-clay",
  filled: "badge-ink",
};

export default function StatusBadge({ status, className = "" }) {
  const style = STYLES[status] || "badge-ink";
  return (
    <span className={`${style} ${className}`}>
      {status}
    </span>
  );
}
