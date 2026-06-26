"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { extractFileIdFromUrl, getFileBlobUrl } from "@/lib/imageFiles";

type FileImageProps = {
  fileId?: string | null;
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
};

const canUseDirectSrc = (value: string) =>
  !!value && !value.includes("/api/tiers/files/") && !value.includes("/api/files/");

export default function FileImage({
  alt,
  className,
  fallback = null,
  fileId,
  src,
}: FileImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState("");

  useEffect(() => {
    let mounted = true;
    const directSrc = (src || "").trim();
    const resolvedFileId = (fileId || extractFileIdFromUrl(directSrc)).trim();

    if (!resolvedFileId) {
      setResolvedSrc(canUseDirectSrc(directSrc) ? directSrc : "");
      return () => {
        mounted = false;
      };
    }

    void getFileBlobUrl(resolvedFileId)
      .then((blobUrl) => {
        if (mounted) setResolvedSrc(blobUrl);
      })
      .catch(() => {
        if (mounted) setResolvedSrc(canUseDirectSrc(directSrc) ? directSrc : "");
      });

    return () => {
      mounted = false;
    };
  }, [fileId, src]);

  if (!resolvedSrc) return <>{fallback}</>;

  return <img src={resolvedSrc} alt={alt} className={className} />;
}
