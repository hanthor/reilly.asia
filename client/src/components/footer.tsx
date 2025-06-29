import { Github, Linkedin, MessageSquare, Globe } from "lucide-react";

export default function Footer() {
  const socialLinks = [
    { icon: Github, href: "https://github.com/hanthor", label: "GitHub" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/jreilly112/", label: "LinkedIn" },
    { icon: MessageSquare, href: "https://matrix.to/#/@james:reilly.asia", label: "Matrix" },
    { icon: Globe, href: "http://reilly.asia", label: "Website" },
  ];

  return (
    <footer className="bg-earth-brown dark:bg-black text-earth-cream py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-earth-cream dark:bg-earth-brown rounded-full flex items-center justify-center">
              <span className="text-earth-brown dark:text-earth-cream font-bold text-sm">JR</span>
            </div>
            <span className="font-semibold">James Reilly</span>
          </div>

          <div className="flex items-center space-x-6">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-earth-teal dark:hover:text-earth-teal transition-colors"
                aria-label={label}
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-earth-rust dark:border-earth-rust mt-8 pt-8 text-center text-sm text-earth-cream dark:text-earth-cream">
          <p>&copy; 2024 James Reilly. Open to consulting opportunities worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
