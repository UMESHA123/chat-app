"use client";

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  className?: string;
  showOnline?: boolean;
  isOnline?: boolean;
}

export default function Avatar({ name, color, size = 40, className = "", showOnline, isOnline }: AvatarProps) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .map((n) => n[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const fontSize = size <= 28 ? 10 : size <= 36 ? 12 : size <= 48 ? 14 : 18;

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="flex items-center justify-center rounded-full font-semibold text-white select-none"
        style={{ width: size, height: size, backgroundColor: color, fontSize }}
      >
        {initials}
      </div>
      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[#111111] ${isOnline ? "bg-green-500" : "bg-gray-500"}`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
