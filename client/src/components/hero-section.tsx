import { Button } from "@/components/ui/button";
import { Mail, Github, MapPin, Globe, MessageSquare, LinkedinIcon } from "lucide-react";

const inlineLink =
  "underline underline-offset-2 font-semibold text-white hover:text-earth-orange transition-colors";
// Secondary CTAs share one outline style so the primary action stands out.
const secondaryCta =
  "border border-earth-cream/70 bg-transparent text-earth-cream hover:bg-earth-cream hover:text-earth-brown";

export default function HeroSection() {
  return (
    <section id="top" className="pt-16">
      <div className="bg-earth-teal">
        <div className="max-w-6xl gap-10 lg:gap-12 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center py-12 lg:py-16">
          <div className="flex-shrink-0">
            <img
              src="/profile.webp"
              alt="Portrait of James Reilly"
              width={256}
              height={256}
              className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full object-cover shadow-lg border-4 border-white"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-earth-cream mb-6">
              James Reilly
            </h1>

            <p className="text-lg sm:text-xl text-earth-cream mb-4 leading-relaxed max-w-3xl">
              I'm a freelance <strong>IT systems administration consultant</strong>, based
              in India and working mostly with clients in the U.S. — open to opportunities anywhere.
              Looking for help with infrastructure, automation, or training?{" "}
              <strong>I'm available for consulting.</strong>
            </p>
            <p className="text-lg sm:text-xl text-earth-cream mb-8 leading-relaxed max-w-3xl">
              Alongside consulting, I'm active in <strong>open source advocacy</strong>, focused right now
              on <strong>bootable containers</strong> — immutable OS images built with OCI and deployed via
              bootc. I'm the creator and lead developer of{" "}
              <a href="https://tunaos.org" target="_blank" rel="noopener noreferrer" className={inlineLink}>
                TunaOS
              </a>, a cloud-native desktop system — see{" "}
              <a href="https://tunaos.org/variants" target="_blank" rel="noopener noreferrer" className={inlineLink}>
                the TunaOS variant landscape
              </a>.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button asChild className="bg-earth-rust hover:bg-earth-rust/90 text-earth-cream shadow-sm">
                <a href="#contact">
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                  Get In Touch
                </a>
              </Button>
              <Button asChild className="bg-earth-cream text-earth-brown hover:bg-white">
                <a href="https://tunaos.org" target="_blank" rel="noopener noreferrer">
                  <Globe className="mr-2 h-4 w-4" aria-hidden="true" />
                  TunaOS.org
                </a>
              </Button>
              <Button asChild className={secondaryCta}>
                <a href="https://github.com/hanthor" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" aria-hidden="true" />
                  GitHub
                </a>
              </Button>
              <Button asChild className={secondaryCta}>
                <a href="https://www.linkedin.com/in/jreilly112/" target="_blank" rel="noopener noreferrer">
                  <LinkedinIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  LinkedIn
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-earth-rust py-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-earth-cream">
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
            India
          </div>
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
            <a
              href="https://matrix.to/#/@james:reilly.asia"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              Matrix: @james:reilly.asia
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
