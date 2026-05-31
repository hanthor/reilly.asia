import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, MessageSquare, Settings } from "lucide-react";

export default function ExpertiseSection() {
  const expertiseAreas = [
    {
      icon: Rocket,
      title: "Linux Infrastructure",
      description: <>
        Mostly working with <a href="https://www.containers.bootc.dev/" target="_blank" rel="noopener noreferrer" className="text-earth-rust dark:text-earth-orange hover:underline">bootable containers</a> these days — <a href="https://opencontainers.org/" target="_blank" rel="noopener noreferrer" className="text-earth-rust dark:text-earth-orange hover:underline">OCI images</a> you deploy as a full OS with atomic updates built in. If you're thinking about immutable infrastructure or want off the treadmill of traditional package management, this is worth looking at.
      </>,
      tags: [
        { name: "bootc", url: "https://www.containers.bootc.dev/" },
        { name: "Fedora", url: "https://fedoraproject.org/" },
        { name: "CentOS", url: "https://www.centos.org/" },
        { name: "Containers", url: "https://www.docker.com/resources/what-container/" }
      ]
    },
    {
      icon: MessageSquare,
      title: "Matrix Services",
      description: <>
        Ran support and technical account management at Element for clients including NATO and the USMC. I know how to deploy <a href="https://matrix.org/" target="_blank" rel="noopener noreferrer" className="text-earth-rust dark:text-earth-orange hover:underline">Matrix</a>, set up bridges, and keep the whole thing running — from a homeserver to a large enterprise deployment.
      </>,
      tags: [
        { name: "Matrix", url: "https://matrix.org/" },
        { name: "WebSocket", url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket" },
        { name: "Bridges" },
        { name: "IM" },
        { name: "Video Conferencing" }
      ]
    },
    {
      icon: Settings,
      title: "Systems Administration",
      description: <>
        Linux and Windows servers, automation, networking, virtualization — the usual sysadmin toolkit. Been doing this since 2015.
      </>,
      tags: [
        { name: "Linux" },
        { name: "Windows" },
        { name: "Automation" },
        { name: "DevOps" },
        { name: "Virtualization" },
        { name: "Networking" }
      ]
    }
  ];



  return (
    <section id="expertise" className="py-16 bg-earth-orange dark:bg-earth-brown">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">Technical Expertise</h2>
          <p className="text-xl text-earth-brown dark:text-earth-cream max-w-3xl mx-auto">
            Things I actually know how to do.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {expertiseAreas.map((area, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
              <CardContent className="p-8">
                <area.icon className="w-8 h-8 text-earth-rust dark:text-earth-orange mb-4" />
                <h3 className="text-xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-4">{area.title}</h3>
                <p className="text-earth-brown dark:text-earth-cream mb-4">{area.description}</p>
                <div className="flex flex-wrap gap-2">
                  {area.tags.map((tag, tagIndex) => (
                    tag.url ? (
                      <a key={tagIndex} href={tag.url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="secondary" className="bg-earth-teal/20 text-earth-rust dark:text-earth-cream hover:bg-earth-teal/30 cursor-pointer">
                          {tag.name}
                        </Badge>
                      </a>
                    ) : (
                      <Badge key={tagIndex} variant="secondary" className="bg-earth-teal/20 text-earth-rust dark:text-earth-cream">
                        {tag.name}
                      </Badge>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
