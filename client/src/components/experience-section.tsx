import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ExternalLink } from "lucide-react";



export default function ExperienceSection() {
  const workExperience = [
    {
      company: "AlmaLinux",
      title: "Co-Chair (Atomic SIG)",
      date: "May 2025 - Present",
      description: "Co-chairing the Atomic Special Interest Group at AlmaLinux.",
      tags: ["FOSS", "Community", "Leadership", "Volunteer"],
      url: "https://almalinux.org/",
      logo: "/almalinuxord.png",
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
      url: "http://reilly.asia",
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
      primaryColor: "#319477",
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
      tags: ["Linux", "Windows", "Desktop Support", "SCCM"],
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
          <h2 className="text-4xl font-heading font-bold mb-4">Work Experience</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {workExperience.map((job, index) => (
            <Card
              key={index}
              className={`hover:shadow-md transition-shadow ${job.primaryColor ? '' : 'bg-earth-cream dark:bg-earth-brown dark:border-earth-rust'}`}
              style={job.primaryColor ? { backgroundColor: job.primaryColor } : {}}
            >
              <CardContent className={`p-6 ${job.forceLightText ? 'text-earth-cream' : 'text-earth-brown dark:text-earth-cream'}`} >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {job.logo ? (
                      <img src={job.logo} alt={`${job.company} logo`} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <Briefcase className="w-5 h-5" />
                    )}
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xl font-heading font-semibold transition-colors">{job.company}</a>
                  </div>
                  <Badge variant="secondary" className={`bg-earth-teal/90 ${job.forceLightText ? 'text-earth-cream' : 'text-earth-brown dark:text-earth-cream'}`}>
                    {job.date}
                  </Badge>
                </div>
                <h4 className="text-lg font-semibold ${job.forceLightText ? 'text-earth-cream' : 'text-earth-brown dark:text-earth-cream'} mb-2">{job.title}</h4>
                <p className="mb-4">{job.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className={`text-xs ${job.forceLightText ? 'text-earth-cream border-earth-cream' : 'text-earth-brown border-earth-brown dark:text-earth-cream'}`}>
                      {tag}
                    </Badge>
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
