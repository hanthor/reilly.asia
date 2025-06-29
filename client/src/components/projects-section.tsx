import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, GitFork, ExternalLink, Github } from "lucide-react";
import { fetchGitHubUser, fetchGitHubRepos } from "@/lib/github-api";

export default function ProjectsSection() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/github/user"],
    queryFn: fetchGitHubUser,
  });

  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ["/api/github/repos"],
    queryFn: fetchGitHubRepos,
  });

  const featuredProjects = [
    {
      name: "bluefin-lts", 
      description: "Bluefin LTS distribution built on CentOS with bootc. Bluefin is inteded to be the Cloud Native desktop experience for devs and luddites alike",
      language: "Shell",
      tags: ["bootc", "CentOS", "Container", "Immutable"],
      url: "https://github.com/ublue-os/bluefin-lts",
      logo: "/ublue-os.png"
    },
    {
      name: "AlmaLinux Bootc Images",
      description: "AlmaLinux bootc images for immutable OS deployments. These images are built using the bootc project and are intended to be used with the AlmaLinux distribution.",
      language: "Shell",
      tags: ["bootc", "Container", "Immutable"],
      url: "https://github.com/almalinux/bootc-images",
      logo: "/almalinuxorg.png"
    },
    {
      name: "tunaOS",
      description: "Custom fork of the bluefin LTS project. Maintaining versions based on Almalinux and Fedora",
      language: "Shell",
      tags: ["bootc", "OS", "Fedora", "AlmaLinux"],
      url: "https://github.com/hanthor/tunaOS"
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

  const getRepoStats = (repoName: string) => {
    const repo = repos.find(r => r.name === repoName);
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
            const stats = getRepoStats(project.name);
            
            return (
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="block">
                <Card key={index} className="hover:shadow-md transition-shadow bg-earth-cream dark:bg-earth-brown dark:border-earth-rust cursor-pointer h-full flex flex-col">
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
                      {project.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs border-earth-rust text-earth-rust">
                          {tag}
                        </Badge>
                      ))}
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
                      <ExternalLink className="ml-1 w-5 h-5 text-earth-teal" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
}