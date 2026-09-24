import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, GitFork, ExternalLink, Github } from "lucide-react";
import { getRepoStats } from "@/lib/github-api";
import { LinkedBadge } from "@/components/linked-badge";

const tagLinks: Record<string, string> = {
  bootc: "https://bootc.dev/",
  Fedora: "https://fedoraproject.org/",
  AlmaLinux: "https://almalinux.org/",
  CentOS: "https://www.centos.org/",
};

interface FeaturedProject {
  name: string;
  repoId?: string;
  description: string;
  language: string;
  tags: string[];
  url: string;
  logo?: string;
  website?: string;
}

export default function ProjectsSection() {
  const featuredProjects: FeaturedProject[] = [
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
  const getLanguageColor = (language: string) => {
    const tints: Record<string, string> = {
      Go: "bg-earth-teal/20",
      Shell: "bg-earth-orange/30",
      Python: "bg-earth-teal/20",
      Makefile: "bg-earth-brown/15 dark:bg-earth-cream/15",
    };
    return `${tints[language] ?? "bg-earth-brown/10"} text-earth-brown dark:text-earth-cream border-0 hover:bg-inherit`;
  };

  return (
    <section id="projects" className="py-16 bg-earth-rust">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-cream dark:text-earth-cream mb-4">Featured Projects</h2>
          <p className="text-xl text-earth-cream dark:text-earth-cream max-w-3xl mx-auto">
            Open source work I'm actively involved in.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {featuredProjects.map((project, index) => {
            const stats = project.repoId ? getRepoStats(project.repoId) : undefined;

            return (
              <Card key={index} className="hover:shadow-md transition-shadow bg-earth-cream dark:bg-earth-brown dark:border-earth-rust h-full flex flex-col">
                <CardContent className="p-6 flex-grow flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {project.logo ? (
                        <img src={project.logo} alt="" width={32} height={32} loading="lazy" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <Github className="w-5 h-5 text-earth-brown dark:text-earth-cream" />
                      )}
                      <h3 className="text-xl font-heading font-semibold text-earth-brown dark:text-earth-cream">{project.name}</h3>
                    </div>
                    <Badge variant="secondary" className={getLanguageColor(project.language)}>
                      {project.language}
                    </Badge>
                  </div>

                  <p className="text-earth-brown dark:text-earth-cream mb-4 flex-grow">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <LinkedBadge
                        key={tag}
                        tag={tag}
                        links={tagLinks}
                        className="text-xs border-earth-rust text-earth-rust dark:border-earth-orange dark:text-earth-orange"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-4 text-sm text-earth-brown dark:text-earth-cream">
                      {stats && (
                        <>
                          <span className="flex items-center" title="GitHub stars">
                            <Star className="w-4 h-4 mr-1" aria-hidden="true" />
                            {stats.stars}
                            <span className="sr-only"> stars</span>
                          </span>
                          <span className="flex items-center" title="Forks">
                            <GitFork className="w-4 h-4 mr-1" aria-hidden="true" />
                            {stats.forks}
                            <span className="sr-only"> forks</span>
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {project.website && (
                        <a
                          href={project.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm text-earth-teal dark:text-earth-cream hover:text-earth-rust dark:hover:text-earth-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Visit ${project.name} website`}
                        >
                          <ExternalLink className="w-5 h-5" aria-hidden="true" />
                        </a>
                      )}
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm text-earth-teal dark:text-earth-cream hover:text-earth-rust dark:hover:text-earth-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`View ${project.name} on GitHub`}
                      >
                        <Github className="w-5 h-5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}