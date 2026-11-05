import Link from "next/link";
import { SparkleIcon } from "@/components/icons";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label={`${SITE_NAME} 首页`}>
      <span className="brand-mark" aria-hidden="true">
        <SparkleIcon />
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>{SITE_NAME}</strong>
          <small>{SITE_TAGLINE}</small>
        </span>
      )}
    </Link>
  );
}
