import { API, type Avatar } from "@/lib/api";
import { AvatarIllustration } from "./AvatarIllustration";

export const portraitSrc = (p?: string | null) => (p ? (p.startsWith("/api/") ? `${API}${p.slice(4)}` : p) : null);

export function Portrait({ avatar, className = "", alt = "" }: { avatar: Avatar; className?: string; alt?: string }) {
  const src = portraitSrc(avatar.portrait);
  return src
    ? <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />
    : <AvatarIllustration options={avatar} className={`h-full w-full ${className}`} />;
}
