import { Github, Linkedin, MessageSquare, Globe } from "lucide-react";

export const socialLinks = [
  { icon: Github, href: "https://github.com/hanthor", label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/jreilly112/", label: "LinkedIn" },
  { icon: MessageSquare, href: "https://matrix.to/#/@james:reilly.asia", label: "Matrix" },
];

export const socialLinksWithWebsite = [
  ...socialLinks,
  { icon: Globe, href: "http://reilly.asia", label: "Website" },
];
