import { Badge } from "@/components/ui/badge";

interface LinkedBadgeProps {
  tag: string;
  links: Record<string, string>;
  className: string;
}

export function LinkedBadge({ tag, links, className }: LinkedBadgeProps) {
  const url = links[tag];
  const badge = (
    <Badge variant="outline" className={className}>
      {tag}
    </Badge>
  );

  if (!url) return badge;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline hover:opacity-80 transition-opacity"
      style={{ color: "inherit" }}
    >
      {badge}
    </a>
  );
}
