import { Card, CardContent } from "@/components/ui/card";

export default function AboutSection() {
  return (
    <section id="about" className="pt-16 bg-earth-cream dark:bg-earth-brown">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">About</h2>
          <p className="text-xl text-earth-brown dark:text-earth-cream max-w-3xl mx-auto">
            Consulting + Educating in modern infrastructure technologies
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
              alt="Modern consulting workspace"
              className="rounded-xl shadow-lg w-full h-auto"
            />
          </div>

          <div className="space-y-6">
            <Card className="bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
              <CardContent className="p-6">
                <h3 className="text-xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-3">Professional Background</h3>
                <p className="text-earth-brown dark:text-earth-cream leading-relaxed">
                  With extensive experience in systems engineering and infrastructure automation,
                  I help organizations modernize their technology stack using cutting-edge container
                  technologies and communication platforms.
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
                  Active contributor to open source projects and member of the AlmaLinux organization.
                  Passionate about sharing knowledge and advancing the state of infrastructure technology.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
