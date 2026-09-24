import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, Globe } from "lucide-react";
import { socialLinks } from "@/lib/social-links";

// In page order, so the nav reads like a table of contents.
const navigationLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#consulting" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Talks", href: "#talks" },
  { label: "Contact", href: "#contact" },
];

const linkClass =
  "rounded-sm text-earth-brown dark:text-earth-cream hover:text-earth-teal dark:hover:text-earth-orange transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const tunaClass =
  "rounded-sm text-earth-rust dark:text-earth-orange hover:text-earth-teal dark:hover:text-earth-cream transition-colors font-bold flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const iconLinkClass =
  "rounded-sm text-earth-brown dark:text-earth-cream hover:text-earth-teal dark:hover:text-earth-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingHref = useRef<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // In the mobile sheet, close the dialog first (it locks body scroll), then
  // follow the anchor once it has fully closed — see onCloseAutoFocus below.
  const followFromMenu = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    pendingHref.current = href;
    setMenuOpen(false);
  };

  const onMenuClosed = (event: Event) => {
    const href = pendingHref.current;
    if (!href) return;
    pendingHref.current = null;
    event.preventDefault(); // don't return focus to the hamburger
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    target.scrollIntoView();
    window.history.replaceState(null, "", href);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  return (
    <nav
      aria-label="Main"
      className={`fixed top-0 w-full z-50 bg-earth-cream/95 dark:bg-earth-brown/95 backdrop-blur-sm border-b transition-colors duration-300 ${
        isScrolled ? "border-earth-rust shadow-sm" : "border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#top" className={`flex items-center gap-2 ${linkClass}`}>
            <span className="w-9 h-9 bg-earth-teal rounded-full flex items-center justify-center">
              <img
                src="/profile-64.webp"
                alt=""
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            </span>
            <span className="font-semibold">James Reilly</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-7">
            {navigationLinks.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
            <a href="/infra/" className={linkClass}>
              Infra
            </a>
            <a href="https://tunaos.org" target="_blank" rel="noopener noreferrer" className={tunaClass}>
              <span>TunaOS</span>
              <Globe size={16} aria-hidden="true" />
            </a>
          </div>

          {/* Social Links & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={iconLinkClass}
                aria-label={label}
              >
                <Icon size={20} aria-hidden="true" />
              </a>
            ))}
            <ThemeToggle />
          </div>

          {/* Mobile Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="text-earth-brown dark:text-earth-cream hover:bg-earth-teal/10"
              >
                <Menu size={22} aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72" aria-describedby={undefined} onCloseAutoFocus={onMenuClosed}>
              <SheetTitle className="sr-only">Site navigation</SheetTitle>
              <div className="flex flex-col gap-5 mt-8">
                {navigationLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => followFromMenu(e, link.href)}
                    className={`text-lg ${linkClass}`}
                  >
                    {link.label}
                  </a>
                ))}
                <a href="/infra/" className={`text-lg ${linkClass}`}>
                  Infra
                </a>
                <a href="https://tunaos.org" target="_blank" rel="noopener noreferrer" className={`text-lg ${tunaClass}`}>
                  <span>TunaOS</span>
                  <Globe size={16} aria-hidden="true" />
                </a>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-5">
                      {socialLinks.map(({ icon: Icon, href, label }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={iconLinkClass}
                          aria-label={label}
                        >
                          <Icon size={22} aria-hidden="true" />
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
