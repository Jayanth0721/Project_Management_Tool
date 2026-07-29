interface EmojiProps {
  name: string;
  size?: number;
  className?: string;
}

const EMOJI_MAP: Record<string, string> = {
  thumbsup: "thumbsup",
  heart: "heart",
  joy: "joy",
  smile: "smile",
  party: "party",
  check: "check",
  cross: "cross",
  eyes: "eyes",
  fire: "fire",
  hundred: "hundred",
  pray: "pray",
  cry: "cry",
  thinking: "thinking",
  thumbsdown: "thumbsdown",
  bulb: "bulb",
  construction: "construction",
  target: "target",
  trophy: "trophy",
  key: "key",
  lock: "lock",
  unlock: "unlock",
  memo: "memo",
  speech: "speech",
  cloud: "cloud",
  sun: "sun",
};

export function Emoji({ name, size = 20, className = "" }: EmojiProps) {
  const file = EMOJI_MAP[name];
  if (!file) return <span className={className}>{name}</span>;
  return (
    <img
      src={`/emoji/${file}.png`}
      alt={name}
      width={size}
      height={size}
      className={`inline-block align-middle ${className}`}
      style={{ imageRendering: "auto" }}
    />
  );
}
