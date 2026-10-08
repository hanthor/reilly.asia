import { SOCIAL_PROFILES } from "./contact-config";

export const socialLinks = SOCIAL_PROFILES.map((profile) => ({
  icon: profile.icon,
  href: profile.href,
  label: profile.label,
}));
