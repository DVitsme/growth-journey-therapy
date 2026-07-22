import Image from "next/image";
import Link from "next/link";
import { Sprout } from "lucide-react";
import type { Person } from "@/lib/team";

/** Fields a byline needs — a slice of `Person` (see lib/team.ts). */
type BylineAuthor = Pick<Person, "slug" | "name" | "title" | "isOrg" | "headshot" | "objectPosition">;

function initials(name: string): string {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

/** Round avatar: clinician photo, org brand-mark (Sprout), or initials fallback. */
function Avatar({ author }: { author: BylineAuthor }) {
  if (author.headshot && !author.isOrg) {
    return (
      <Image
        src={author.headshot}
        alt=""
        width={48}
        height={48}
        className="size-11 shrink-0 rounded-full object-cover"
        style={author.objectPosition ? { objectPosition: author.objectPosition } : undefined}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid size-11 shrink-0 place-items-center rounded-full bg-panel font-display font-semibold text-green"
    >
      {author.isOrg ? <Sprout className="size-5" strokeWidth={1.75} /> : <span className="text-base">{initials(author.name)}</span>}
    </span>
  );
}

/** Optionally-linked author name. `href` is wired in Phase 3 (once /team/[slug] exists). */
function AuthorName({ author, href, className }: { author: BylineAuthor; href?: string; className?: string }) {
  const cls = `${className ?? ""} underline-offset-4 hover:text-green hover:underline`.trim();
  return href ? (
    <Link href={href} className={cls}>
      {author.name}
    </Link>
  ) : (
    <span className={className}>{author.name}</span>
  );
}

/** Credentialed byline for the post header: avatar + "By {Name}" + role/title. */
export function AuthorByline({ author, href }: { author: BylineAuthor; href?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar author={author} />
      <div className="leading-tight">
        <p className="text-base text-ink-soft">
          By <AuthorName author={author} href={href} className="font-semibold text-ink" />
        </p>
        {!author.isOrg && author.title && <p className="text-sm text-ink-soft">{author.title}</p>}
      </div>
    </div>
  );
}

/** Compact author label for index cards. */
export function AuthorBylineCompact({ author, href }: { author: BylineAuthor; href?: string }) {
  return (
    <span className="text-sm text-ink-soft">
      By <AuthorName author={author} href={href} className="text-ink" />
    </span>
  );
}
