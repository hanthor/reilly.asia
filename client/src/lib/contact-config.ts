import { Github, Linkedin, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Primary contact methods
export const PRIMARY_EMAIL = "jreilly1821@gmail.com";

// Social profiles - used across hero, contact, and navigation sections
export interface SocialProfile {
  id: string;
  platform: "github" | "linkedin" | "matrix";
  icon: LucideIcon;
  label: string;
  href: string;
  username: string;
}

export const SOCIAL_PROFILES: SocialProfile[] = [
  {
    id: "github",
    platform: "github",
    icon: Github,
    label: "GitHub",
    href: "https://github.com/hanthor",
    username: "@hanthor",
  },
  {
    id: "linkedin",
    platform: "linkedin",
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/jreilly112/",
    username: "jreilly112",
  },
  {
    id: "matrix",
    platform: "matrix",
    icon: MessageSquare,
    label: "Matrix",
    href: "https://matrix.to/#/@james:reilly.asia",
    username: "@james:reilly.asia",
  },
];

// Contact display format for contact section
export interface ContactMethod {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  url: string;
  color: string;
}

export const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: Linkedin,
    title: "LinkedIn",
    subtitle: "Professional Network",
    url: "https://www.linkedin.com/in/jreilly112/",
    color: "text-earth-teal dark:text-earth-orange",
  },
  {
    icon: Github,
    title: "GitHub",
    subtitle: "@hanthor",
    url: "https://github.com/hanthor",
    color: "text-earth-brown dark:text-earth-cream",
  },
  {
    icon: MessageSquare,
    title: "Matrix",
    subtitle: "@james:reilly.asia",
    url: "https://matrix.to/#/@james:reilly.asia",
    color: "text-earth-rust dark:text-earth-orange",
  },
];

// Location information
export const LOCATION_INFO = {
  primary: "India",
  secondary: "Ohio, USA",
  displayText: "Based in India · Ohio, USA company",
};

// Build a social profile by ID for easy lookup
export function getSocialProfileById(id: string): SocialProfile | undefined {
  return SOCIAL_PROFILES.find((p) => p.id === id);
}

// Get all social profile URLs (useful for SEO/metadata)
export function getAllSocialUrls(): string[] {
  return SOCIAL_PROFILES.map((p) => p.href);
}
