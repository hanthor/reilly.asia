/**
 * Centralized contact and social links configuration.
 * Single source of truth for all contact information across the site.
 */

import { Github, Linkedin, MessageSquare } from "lucide-react";

export const contactConfig = {
  email: "jreilly1821@gmail.com",
  github: {
    username: "hanthor",
    url: "https://github.com/hanthor",
  },
  linkedin: {
    username: "jreilly112",
    url: "https://www.linkedin.com/in/jreilly112/",
  },
  matrix: {
    id: "@james:reilly.asia",
    url: "https://matrix.to/#/@james:reilly.asia",
  },
  repos: {
    dotfiles: "https://github.com/hanthor/dotfiles",
    reillyAsia: "https://github.com/hanthor/reilly.asia",
  },
};

export const socialLinks = [
  {
    icon: Github,
    href: contactConfig.github.url,
    label: "GitHub",
    title: "GitHub",
    subtitle: contactConfig.github.username,
    color: "text-earth-brown dark:text-earth-cream",
  },
  {
    icon: Linkedin,
    href: contactConfig.linkedin.url,
    label: "LinkedIn",
    title: "LinkedIn",
    subtitle: "Professional Network",
    color: "text-earth-teal dark:text-earth-orange",
  },
  {
    icon: MessageSquare,
    href: contactConfig.matrix.url,
    label: "Matrix",
    title: "Matrix",
    subtitle: contactConfig.matrix.id,
    color: "text-earth-rust dark:text-earth-orange",
  },
];
