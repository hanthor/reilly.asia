import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, Github, Linkedin, Globe, MessageSquare } from "lucide-react";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navigationLinks = [
    { label: "About", href: "about" },
    { label: "Expertise", href: "expertise" },
    { label: "Projects", href: "projects" },
    { label: "Experience", href: "experience" },
    { label: "Contact", href: "contact" },
  ];

  const socialLinks = [
    { icon: Github, href: "https://github.com/hanthor", label: "GitHub" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/jreilly112/", label: "LinkedIn" },
    { icon: MessageSquare, href: "https://matrix.to/#/@james:reilly.asia", label: "Matrix" },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? "bg-earth-cream/90 dark:bg-earth-brown/90 backdrop-blur-sm border-b border-earth-rust dark:border-earth-rust shadow-sm" : "bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-earth-teal rounded-full flex items-center justify-center">
              <img
                src="/profile.png"
                alt="James Reilly"
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <span className="font-semibold text-earth-brown dark:text-earth-cream">James Reilly</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-earth-brown dark:text-earth-cream hover:text-earth-teal dark:hover:text-earth-teal transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Social Links & Theme Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-earth-brown dark:text-earth-cream hover:text-earth-teal dark:hover:text-earth-teal transition-colors"
                aria-label={label}
              >
                <Icon size={20} />
              </a>
            ))}
            <ThemeToggle />
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-6 mt-8">
                {navigationLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-left text-earth-brown dark:text-earth-cream hover:text-earth-teal dark:hover:text-earth-teal transition-colors font-medium"
                  >
                    {link.label}
                  </button>
                ))}
                
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                      {socialLinks.map(({ icon: Icon, href, label }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-earth-brown dark:text-earth-cream hover:text-earth-teal dark:hover:text-earth-teal transition-colors"
                          aria-label={label}
                        >
                          <Icon size={20} />
                        </a>
                      ))}
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
