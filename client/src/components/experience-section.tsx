import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { LinkedBadge } from "@/components/linked-badge";

const tagLinks: Record<string, string> = {
  Matrix: "https://matrix.org",
  Moodle: "https://moodle.org",
  SCCM: "https://learn.microsoft.com/en-us/intune/configmgr/",
  JAMF: "https://www.jamf.com",
};

export default function ExperienceSection() {
  const workExperience = [
    {
      company: "AlmaLinux",
      title: "Co-Chair (Atomic SIG)",
      date: "May 2025 - Present",
      description: "Co-chairing the Atomic Special Interest Group at AlmaLinux.",
      tags: ["FOSS", "Community", "Leadership", "Volunteer"],
      url: "https://almalinux.org/",
      logo: "/almalinuxorg.png",
      primaryColor: "#ccaa42",
      forceLightText: false,
    },
    {
      company: "FOSS United Foundation",
      title: "Volunteer",
      date: "June 2024 - Present",
      description: "Volunteering for FOSS United, a non-profit organization promoting and strengthening the Free and Open Source Software ecosystem in India.",
      tags: ["FOSS", "Community", "Volunteer"],
      url: "https://fossunited.org/",
      logo: "/FOSSUnitedLucknow.jpg",
      primaryColor: "#191919",
      forceLightText: true,
    },
    {
      company: "James Reilly Consulting",
      title: "Consultant",
      date: "September 2021 - Present",
      description: "Consulting on setup, maintenance, and architecting of primarily FOSS solutions. Currently managing a Moodle site for The Redwoods Group.",
      tags: ["Consulting", "FOSS", "Moodle", "Solution Architecture"],
      url: "#contact",
      logo: null, // No specific logo provided, will use Briefcase icon
      primaryColor: null,
      forceLightText: false,
    },
    {
      company: "Element",
      title: "Support Engineer",
      date: "August 2022 - December 2023",
      description: "Provided technical support for Element products, working with high-profile clients like NATO and the USMC. Evolved into a Technical Account Manager and Solution Architect role.",
      tags: ["Matrix", "Support", "Technical Account Manager", "Solution Architecture"],
      url: "https://element.io/",
      logo: "/element_hq_logo.jpg",
      primaryColor: "#1f6e59", // Element green, darkened for AA with cream text
      forceLightText: true,
    },
    {
      company: "Beeper",
      title: "Product Support",
      date: "June 2021 - February 2022",
      description: "Part of the initial 2-person support team, scaling from 200 to 4000 users. Helped build out support workflows and escalation procedures.",
      tags: ["Support", "Startup", "Customer Success", "Matrix"],
      url: "https://www.beeper.com/",
      logo: "/beeperhq_logo.jpg",
      primaryColor: "#9ba3f5",
      forceLightText: false,
    },
    {
      company: "The Ohio State University",
      title: "System Specialist",
      date: "November 2015 - October 2021",
      description: "Windows/Linux server administration, desktop support, and primary IT support contact for the Center on Education and Training for Employment (CETE).",
      tags: ["Linux", "Windows", "Desktop Support", "SCCM", "JAMF"],
      url: "https://cete.osu.edu/",
      logo: "/OSU.jpg",
      primaryColor: "#8b4949",
      forceLightText: true,
    },
  ];

  return (
    <section id="experience" className="py-16 dark:bg-earth-brown">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">Work Experience</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {workExperience.map((job, index) => {
            // Brand-coloured cards keep a fixed text colour in both themes;
            // only the plain card follows light/dark.
            const textClass = job.forceLightText
              ? "text-earth-cream"
              : job.primaryColor
                ? "text-[#241d19]"
                : "text-earth-brown dark:text-earth-cream";
            const tagClass = job.forceLightText
              ? "text-earth-cream border-earth-cream"
              : job.primaryColor
                ? "text-[#241d19] border-[#241d19]"
                : "text-earth-brown border-earth-brown dark:text-earth-cream dark:border-earth-cream";
            return (
            <Card
              key={index}
              className={`hover:shadow-md transition-shadow ${job.primaryColor ? 'border-transparent' : 'bg-earth-cream dark:bg-earth-brown dark:border-earth-rust'}`}
              style={job.primaryColor ? { backgroundColor: job.primaryColor } : {}}
            >
              <CardContent className={`p-6 ${textClass}`}>
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 mb-4">
                  <div className="flex items-center gap-3">
                    {job.logo ? (
                      <img src={job.logo} alt="" width={32} height={32} loading="lazy" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <Briefcase className="w-5 h-5 shrink-0" aria-hidden="true" />
                    )}
                    <h3 className="text-xl font-heading font-semibold">
                      <a href={job.url} {...(job.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="hover:underline underline-offset-2">{job.company}</a>
                    </h3>
                  </div>
                  <Badge variant="secondary" className={`whitespace-nowrap bg-transparent hover:bg-transparent border border-current ${textClass}`}>
                    {job.date}
                  </Badge>
                </div>
                <p className="text-lg font-semibold mb-2">{job.title}</p>
                <p className="mb-4">{job.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.tags.map((tag) => (
                    <LinkedBadge
                      key={tag}
                      tag={tag}
                      links={tagLinks}
                      className={`text-xs ${tagClass}`}
                    />
                  ))}
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
