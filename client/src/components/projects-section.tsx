import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, GitFork, ExternalLink, Github } from "lucide-react";
import { getRepoStats } from "@/lib/github-api";
import { LinkedBadge } from "@/components/linked-badge";
import {
  FeaturedProject,
  FEATURED_PROJECTS,
  TAG_LINKS,
  getLanguageColor,
} from "@/lib/projects-config";

export default function ProjectsSection() {
  const featuredProjects: FeaturedProject[] = FEATURED_PROJECTS;


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
                        links={TAG_LINKS}
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