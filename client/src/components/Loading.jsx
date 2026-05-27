export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-figma-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-purple animate-spin" />
      </div>
      <p className="text-sm text-figma-gray">{text}</p>
    </div>
  );
}
