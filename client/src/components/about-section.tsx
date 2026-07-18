import { Card, CardContent } from "@/components/ui/card";

export default function AboutSection() {
  return (
    <section id="about" className="pt-16 bg-earth-cream dark:bg-earth-brown">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">About</h2>
          <p className="text-xl text-earth-brown dark:text-earth-cream max-w-3xl mx-auto">
            Freelance IT systems administration consulting and open source advocacy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
            <CardContent className="p-6">
              <h3 className="text-xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-3">Professional Background</h3>
              <p className="text-earth-brown dark:text-earth-cream leading-relaxed">
                I'm a freelance systems engineer based in India, working primarily with U.S. clients — and open to
                engagements anywhere. I help organizations modernize their technology stack using bootable
                container technologies and communication platforms, on-site or fully remote.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
            <CardContent className="p-6">
              <h3 className="text-xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-3">Core Philosophy</h3>
              <p className="text-earth-brown dark:text-earth-cream leading-relaxed">
                I believe in building robust, maintainable systems that scale with organizations.
                My approach focuses on automation, security, and empowering teams through
                education and best practices.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
            <CardContent className="p-6">
              <h3 className="text-xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-3">Community Involvement</h3>
              <p className="text-earth-brown dark:text-earth-cream leading-relaxed">
                Active in open source advocacy in India — organizing and speaking at FOSS United Lucknow meetups,
                co-chairing the AlmaLinux Atomic SIG, and contributing across the bootc and Bluefin ecosystems.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
