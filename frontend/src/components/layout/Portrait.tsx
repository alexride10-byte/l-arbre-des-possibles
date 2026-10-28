import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { API, authHeaders, type Avatar } from "@/lib/api";
import { AvatarIllustration } from "./AvatarIllustration";

export const portraitSrc = (p?: string | null) => (p ? (p.startsWith("/api/") ? `${API}${p.slice(4)}` : p) : null);

// Stored images require authentication, so they are fetched with the token and shown as blob URLs
const blobs = new Map<string, Promise<string | null>>();
const loadBlob = (url: string) => {
  if (!blobs.has(url)) {
    blobs.set(url, fetch(url, { credentials: "include", headers: authHeaders() })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => URL.createObjectURL(b))
      .catch(() => { blobs.delete(url); return null; }));
  }
  return blobs.get(url)!;
};

export function usePortraitSrc(p?: string | null) {
  const url = portraitSrc(p);
  const isPrivate = !!p?.startsWith("/api/");
  const [blob, setBlob] = useState<{ url: string; src: string | null } | null>(null);
  useEffect(() => {
    if (!url || !isPrivate) return;
    let live = true;
    loadBlob(url).then((src) => { if (live) setBlob({ url, src }); });
    return () => { live = false; };
  }, [url, isPrivate]);
  if (!url) return null;
  return isPrivate ? (blob?.url === url ? blob.src : null) : url;
}

export function AuthImg({ src, ...p }: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null }) {
  const s = usePortraitSrc(src);
  return s ? <img src={s} {...p} /> : null;
}

export function Portrait({ avatar, className = "", alt = "" }: { avatar: Avatar; className?: string; alt?: string }) {
  const src = usePortraitSrc(avatar.portrait);
  return src
    ? <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />
    : <AvatarIllustration options={avatar} className={`h-full w-full ${className}`} />;
}
