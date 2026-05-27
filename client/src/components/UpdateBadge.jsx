export default function UpdateBadge({ count = 0 }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-pink/10 border border-accent-pink/20 rounded-full text-xs font-medium text-accent-pink">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-pink animate-pulse" />
      {count} update{count > 1 ? 's' : ''}
    </span>
  );
}
