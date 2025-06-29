import { Button } from "@/components/ui/button";
import { Mail, Github, MapPin, Globe, MessageSquare, LinkedinIcon } from "lucide-react";

export default function HeroSection() {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="pt-24">
      <div className="bg-earth-teal">
        <div className="max-w-6xl gap-12 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center py-16 p-8">
            <div className="flex-shrink-0">
              <img
                src="/profile.png"
                alt="James Reilly"
                className="w-64 h-64 rounded-full object-cover shadow-lg border-4 border-white"
              />
            </div>

          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-heading font-bold text-earth-cream dark:text-earth-cream mb-6">
              James Reilly
            </h1>

            <p className="text-xl text-earth-cream dark:text-earth-cream mb-8 leading-relaxed max-w-3xl">
              Systems consultant specializing in{" "}
              <strong className="text-earth-cream dark:text-earth-cream">Linux infrastructure</strong>,{" "}
              <strong className="text-earth-cream dark:text-earth-cream">Matrix services</strong>, and{" "}
              <strong className="text-earth-cream dark:text-earth-cream">enterprise systems administration</strong>.
              Helping organizations build resilient, scalable infrastructure solutions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button onClick={scrollToContact} className="bg-earth-rust hover:bg-earth-cream/90 text-earth-cream">
                <Mail className="mr-2 h-4 w-4" />
                Get In Touch
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-black text-white bg-black hover:bg-earth-teal/80"
              >
                <a href="https://github.com/hanthor" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View GitHub
                </a>
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-blue-500 text-white bg-blue-500 hover:bg-earth-cream/100"
              >
                <a href="https://linkedin/in/jreilly112" target="_blank" rel="noopener noreferrer">
                  <LinkedinIcon className="mr-2 h-4 w-4" />
                  View LinkedIn
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-earth-rust py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-4 justify-center lg:justify-start">
          <div className="flex items-center text-sm text-earth-cream dark:text-earth-cream">
            <MapPin className="mr-2 h-4 w-4" />
            India
          </div>
          <div className="flex items-center text-sm text-earth-cream dark:text-earth-cream">
            <Globe className="mr-2 h-4 w-4" />
            <a href="http://reilly.asia" target="_blank" rel="noopener noreferrer" className="hover:text-earth-cream/80">
              reilly.asia
            </a>
          </div>
          <div className="flex items-center text-sm text-earth-cream dark:text-earth-cream">
            <MessageSquare className="mr-2 h-4 w-4" />
            <a href="https://matrix.to/#/@james:reilly.asia" target="_blank" rel="noopener noreferrer" className="hover:text-earth-cream/80">
              Matrix
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
