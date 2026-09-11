import { Github, Linkedin, MessageSquare, Globe, LucideIcon } from "lucide-react";

export interface SocialLink {
  icon: LucideIcon;
  href: string;
  label: string;
  title?: string;
  subtitle?: string;
  color?: string;
}

export const GITHUB_URL = "https://github.com/hanthor";
export const LINKEDIN_URL = "https://www.linkedin.com/in/jreilly112/";
export const MATRIX_URL = "https://matrix.to/#/@james:reilly.asia";
export const WEBSITE_URL = "http://reilly.asia";
export const TUNAOS_URL = "https://tunaos.org";

export const socialLinks: SocialLink[] = [
  {
    icon: Github,
    href: GITHUB_URL,
    label: "GitHub",
    title: "GitHub",
    subtitle: "@hanthor",
    color: "text-earth-brown dark:text-earth-cream",
  },
  {
    icon: Linkedin,
    href: LINKEDIN_URL,
    label: "LinkedIn",
    title: "LinkedIn",
    subtitle: "Professional Network",
    color: "text-earth-teal",
  },
  {
    icon: MessageSquare,
    href: MATRIX_URL,
    label: "Matrix",
    title: "Matrix",
    subtitle: "@james:reilly.asia",
    color: "text-earth-orange",
  },
];

export const socialLinksWithWebsite: SocialLink[] = [
  ...socialLinks,
  {
    icon: Globe,
    href: WEBSITE_URL,
    label: "Website",
    title: "Website",
    subtitle: "reilly.asia",
    color: "text-earth-teal",
  },
];
