import { socialLinks } from "@/lib/social-links";

export default function Footer() {
  return (
    <footer className="bg-earth-brown dark:bg-[hsl(20_14%_8%)] text-earth-cream py-12">
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
                className="rounded-sm text-earth-cream hover:text-earth-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth-orange"
                aria-label={label}
              >
                <Icon size={20} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-earth-rust dark:border-earth-rust mt-8 pt-8 text-center text-sm text-earth-cream dark:text-earth-cream">
          <p className="font-bold">James Reilly Consulting LLC</p>
          <p>Registered in Ohio, USA · Based in India</p>
                    <p className="mt-2 text-earth-cream/85">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
