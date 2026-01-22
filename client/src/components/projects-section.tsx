import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, GitFork, ExternalLink, Github } from "lucide-react";
import { fetchGitHubUser, fetchGitHubRepos } from "@/lib/github-api";

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
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/github/user"],
    queryFn: fetchGitHubUser,
  });

  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ["/api/github/repos"],
    queryFn: fetchGitHubRepos,
  });

  const featuredProjects: FeaturedProject[] = [
    {
      name: "bluefin-lts",
      repoId: "ublue-os/bluefin-lts",
      description: "Bluefin LTS distribution built on CentOS with bootc. Bluefin is intended to be the Cloud Native desktop experience for devs and luddites alike",
      language: "Shell",
      tags: ["bootc", "CentOS", "Container", "Immutable"],
      url: "https://github.com/ublue-os/bluefin-lts",
      logo: "/ublue-os.png"
    },
    {
      name: "AlmaLinux Bootc Images",
      repoId: "almalinux/bootc-images",
      description: "AlmaLinux bootc images for immutable OS deployments. These images are built using the bootc project and are intended to be used with the AlmaLinux distribution.",
      language: "Shell",
      tags: ["bootc", "Container", "Immutable"],
      url: "https://github.com/almalinux/bootc-images",
      logo: "/almalinuxorg.png"
    },
    {
      name: "tunaOS",
      repoId: "tuna-os/tunaos",
      description: "A cloud-native immutable desktop OS built on bootc technology. TunaOS provides atomic updates, container-native workflows, and maintains versions based on both AlmaLinux and Fedora. Visit tunaos.org to learn more.",
      language: "Shell",
      tags: ["bootc", "OS", "Fedora", "AlmaLinux", "Immutable"],
      url: "https://github.com/tuna-os/tunaos",
      logo: "https://avatars.githubusercontent.com/u/223733964?s=200&v=4",
      website: "https://tunaos.org"
    }
  ];

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      Go: "bg-earth-teal/20 text-earth-teal",
      Shell: "bg-earth-orange/20 text-earth-orange",
      Kotlin: "bg-earth-rust/20 text-earth-rust",
      TypeScript: "bg-earth-teal/20 text-earth-teal",
      JavaScript: "bg-earth-yellow/20 text-earth-yellow",
    };
    return colors[language] || "bg-gray-100 text-gray-700";
  };

  const getRepoStats = (project: FeaturedProject) => {
    const repo = repos.find(r =>
      project.repoId ? r.full_name === project.repoId : r.name === project.name
    );
    return repo ? { stars: repo.stargazers_count, forks: repo.forks_count } : { stars: 0, forks: 0 };
  };

  return (
    <section id="projects" className="py-16 bg-earth-rust">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-cream dark:text-earth-cream mb-4">Featured Projects</h2>
          <p className="text-xl text-earth-cream dark:text-earth-cream max-w-3xl mx-auto">
            Open source contributions and consulting work in infrastructure and communication technologies
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {featuredProjects.map((project, index) => {
            const stats = getRepoStats(project);

            return (
              <Card key={index} className="hover:shadow-md transition-shadow bg-earth-cream dark:bg-earth-brown dark:border-earth-rust h-full flex flex-col">
                <CardContent className="p-6 flex-grow flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {project.logo ? (
                        <img src={project.logo} alt={`${project.name} logo`} className="w-8 h-8 rounded-full object-cover" />
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
                    {project.tags.map((tag, tagIndex) => {
                      const tagLinks: Record<string, string> = {
                        "bootc": "https://bootc.io/",
                        "Fedora": "https://fedoraproject.org/",
                        "AlmaLinux": "https://almalinux.org/",
                        "CentOS": "https://www.centos.org/",
                      };
                      const url = tagLinks[tag];
                      const badge = (
                        <Badge key={tagIndex} variant="outline" className="text-xs border-earth-rust text-earth-rust">
                          {tag}
                        </Badge>
                      );

                      return url ? (
                        <a
                          key={tagIndex}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="no-underline hover:opacity-80 transition-opacity"
                          style={{ color: 'inherit' }}
                        >
                          {badge}
                        </a>
                      ) : badge;
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-4 text-sm text-earth-brown dark:text-earth-cream">
                      {stats ? (
                        <>
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            {stats.stars}
                          </span>
                          <span className="flex items-center">
                            <GitFork className="w-4 h-4 mr-1" />
                            {stats.forks}
                          </span>
                        </>
                      ) : (
                        reposLoading && (
                          <div className="flex space-x-4">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {project.website && (
                        <a
                          href={project.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-earth-teal hover:text-earth-orange transition-colors"
                          aria-label={`Visit ${project.name} website`}
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-earth-teal hover:text-earth-orange transition-colors"
                        aria-label={`View ${project.name} on GitHub`}
                      >
                        <Github className="w-5 h-5" />
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