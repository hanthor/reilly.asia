export interface FeaturedProject {
  name: string;
  repoId?: string;
  description: string;
  language: string;
  tags: string[];
  url: string;
  logo?: string;
  website?: string;
}

export const TAG_LINKS: Record<string, string> = {
  bootc: "https://bootc.dev/",
  Fedora: "https://fedoraproject.org/",
  AlmaLinux: "https://almalinux.org/",
  CentOS: "https://www.centos.org/",
};

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    name: "Hive",
    repoId: "hivecommons/hive",
    description: "AI agent orchestration for open source: a supervised fleet of agents that triage, fix, review and ship across a project's repos, with guardrails that scale from advisory to full autonomy. I'm one of its maintainers.",
    language: "Go",
    tags: ["AI Agents", "Kubernetes", "Go", "DevOps"],
    url: "https://github.com/hivecommons/hive",
    logo: "/hivecommons.png",
    website: "https://hive.hivecommons.dev/"
  },
  {
    name: "utah",
    repoId: "projectbluefin/utah",
    description: "Utahraptor: Bluefin rebuilt on Fedora Hummingbird's hardened bootable base, with the GNOME 51 desktop built from source and an offline, LUKS2-encrypted install verified end to end. Experimental pre-alpha.",
    language: "Python",
    tags: ["bootc", "Fedora", "Bluefin", "GNOME"],
    url: "https://github.com/projectbluefin/utah",
    logo: "/ublue-os.png"
  },
  {
    name: "bluefin-lts",
    repoId: "ublue-os/bluefin-lts",
    description: "Bluefin LTS built on CentOS with bootc — a cloud-native desktop for developers and people who just want a Linux box that stays out of the way.",
    language: "Shell",
    tags: ["bootc", "CentOS", "Container", "Immutable"],
    url: "https://github.com/ublue-os/bluefin-lts",
    logo: "/ublue-os.png"
  },
  {
    name: "bootc-installer",
    repoId: "projectbluefin/bootc-installer",
    description: "A libadwaita graphical installer for bootc systems, forked from Vanilla OS. Makes it possible to install bootable container images with a proper GUI install flow.",
    language: "Python",
    tags: ["bootc", "Installer", "GTK", "Bluefin"],
    url: "https://github.com/projectbluefin/bootc-installer",
    logo: "/ublue-os.png"
  },
  {
    name: "dakota",
    repoId: "projectbluefin/dakota",
    description: "The build system behind Bluefin. Manages the image pipeline, layering, and release process for Project Bluefin.",
    language: "Makefile",
    tags: ["Bluefin", "CI/CD", "bootc", "Container"],
    url: "https://github.com/projectbluefin/dakota",
    logo: "/ublue-os.png"
  },
  {
    name: "tunaOS",
    repoId: "tuna-os/tunaos",
    description: "A cloud-native immutable desktop OS for enterprise Linux, built on bootc. Offers atomic updates and versions based on both AlmaLinux and Fedora.",
    language: "Shell",
    tags: ["bootc", "AlmaLinux", "Fedora", "Immutable"],
    url: "https://github.com/tuna-os/tunaos",
    logo: "/tunaos.webp",
    website: "https://tunaos.org"
  },
  {
    name: "AlmaLinux Bootc Images",
    repoId: "almalinux/bootc-images",
    description: "Bootable container images for AlmaLinux — immutable OS deployments via OCI. Part of the AlmaLinux Atomic SIG.",
    language: "Shell",
    tags: ["bootc", "AlmaLinux", "Container", "Immutable"],
    url: "https://github.com/almalinux/bootc-images",
    logo: "/almalinuxorg.png"
  },
  {
    name: "knuckle",
    repoId: "projectbluefin/knuckle",
    description: "Deploy Flatcar Container Linux at home with a familiar UX. Takes the rough edges off self-hosted Flatcar and makes it feel like a proper homelab distro.",
    language: "Go",
    tags: ["Flatcar", "Homelab", "Container Linux"],
    url: "https://github.com/projectbluefin/knuckle",
    logo: "/ublue-os.png"
  }
];

// Tinted background per language, but text stays brown/cream so every
// pill meets contrast in both themes.
export function getLanguageColor(language: string): string {
  const tints: Record<string, string> = {
    Go: "bg-earth-teal/20",
    Shell: "bg-earth-orange/30",
    Python: "bg-earth-teal/20",
    Makefile: "bg-earth-brown/15 dark:bg-earth-cream/15",
  };
  return `${tints[language] ?? "bg-earth-brown/10"} text-earth-brown dark:text-earth-cream border-0 hover:bg-inherit`;
}
