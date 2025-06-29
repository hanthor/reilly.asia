import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, MessageSquare, Settings } from "lucide-react";

export default function ExpertiseSection() {
  const expertiseAreas = [
    {
      icon: Rocket,
      title: "Linux Infrastructure",
      description: <>
        Currently exploring and implementing <a href="https://www.containers.bootc.dev/" target="_blank" rel="noopener noreferrer" className="text-earth-rust hover:underline">bootable containers</a> for immutable OS deployments and transactional system updates using <a href="https://opencontainers.org/" target="_blank" rel="noopener noreferrer" className="text-earth-rust hover:underline">OCI container images</a>.
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
        Advanced <a href="https://matrix.org/" target="_blank" rel="noopener noreferrer" className="text-earth-rust hover:underline">Matrix protocol</a> implementation, bridge development, and enterprise communication infrastructure design and deployment.
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
        Comprehensive system management, <a href="https://www.redhat.com/en/topics/automation/what-is-homelab" target="_blank" rel="noopener noreferrer" className="text-earth-rust hover:underline">homelab automation</a>, network infrastructure, and enterprise-grade deployment strategies.
      </>,
      tags: [
        { name: "Linux" },
        { name: "Windows"},
        { name: "Automation" },
        { name: "DevOps" },
        { name: "Virtualization" },
        { name: "Networking" }
      ]
    }
  ];

  const technicalSkills = [
    { emoji: "🐧", name: "Linux" },
    { emoji: "🐚", name: "Shell" },
    { emoji: "📦", name: "Containers", url: "https://www.opencontianers.com/" },
    { emoji: "☸️", name: "K8s (CKA)", url: "https://www.credly.com/badges/6981c486-f220-4198-8b7b-36250b637a79/" },
    { emoji: "🔧", name: "Ansible", url: "https://www.ansible.com/" },
    { emoji: "🌐", name: "HTTP/HTTPS" },
    { emoji: "🔒", name: "TLS/SSL" },
    { emoji: "📡", name: "Networking" },
    { emoji: "🗄️", name: "Databases" },
    { emoji: "🖥️", name: "Virtualization" },
    { emoji: "📊", name: "Monitoring" },
    { emoji: "🛠️", name: "DevOps Tools" }
  ];

  return (
    <section id="expertise" className="py-16 bg-earth-orange dark:bg-earth-brown">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">Technical Expertise</h2>
          <p className="text-xl text-earth-brown dark:text-earth-cream max-w-3xl mx-auto">
            Specialized knowledge in modern infrastructure and communication technologies
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {expertiseAreas.map((area, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
              <CardContent className="p-8">
                <area.icon className="w-8 h-8 text-earth-rust dark:text-earth-rust mb-4" />
                <h3 className="text-xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-4">{area.title}</h3>
                <p className="text-earth-brown dark:text-earth-cream mb-4">{area.description}</p>
                <div className="flex flex-wrap gap-2">
                  {area.tags.map((tag, tagIndex) => (
                    tag.url ? (
                      <a key={tagIndex} href={tag.url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="secondary" className="bg-earth-teal/20 text-earth-rust hover:bg-earth-teal/30 cursor-pointer">
                          {tag.name}
                        </Badge>
                      </a>
                    ) : (
                      <Badge key={tagIndex} variant="secondary" className="bg-earth-teal/20 text-earth-rust">
                        {tag.name}
                      </Badge>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-8 text-center">Technical Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {technicalSkills.map((skill, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{skill.emoji}</div>
                  <span className="text-sm font-medium text-earth-brown dark:text-earth-cream">{skill.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
