import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Linkedin, Github, MessageSquare, Info } from "lucide-react";

const CONTACT_EMAIL = "jreilly1821@gmail.com";

const projectTypes = [
  { value: "bootc", label: "bootc Infrastructure" },
  { value: "matrix", label: "Matrix Services" },
  { value: "sysadmin", label: "Systems Administration" },
  { value: "consulting", label: "General Consulting" },
  { value: "other", label: "Other" },
];

const contactMethods = [
  {
    icon: Linkedin,
    title: "LinkedIn",
    subtitle: "Professional Network",
    url: "https://www.linkedin.com/in/jreilly112/",
    color: "text-earth-teal dark:text-earth-orange",
  },
  {
    icon: Github,
    title: "GitHub",
    subtitle: "@hanthor",
    url: "https://github.com/hanthor",
    color: "text-earth-brown dark:text-earth-cream",
  },
  {
    icon: MessageSquare,
    title: "Matrix",
    subtitle: "@james:reilly.asia",
    url: "https://matrix.to/#/@james:reilly.asia",
    color: "text-earth-rust dark:text-earth-orange",
  },
];

const labelClass = "text-earth-cream";
const errorClass = "text-sm font-medium text-earth-cream bg-black/25 rounded px-2 py-1 mt-1";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

function validate(form: FormData): Errors {
  const errors: Errors = {};
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  if (!name) errors.name = "Name is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Valid email is required";
  if (message.length < 10) errors.message = "Message must be at least 10 characters";
  return errors;
}

export default function ContactSection() {
  const [projectType, setProjectType] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");

  // The consulting cards preselect a project type via this event
  // (the component is already mounted, so a URL param alone wouldn't do it).
  useEffect(() => {
    const onPreselect = (e: Event) => setProjectType((e as CustomEvent<string>).detail);
    window.addEventListener("contact:preselect", onPreselect);
    return () => window.removeEventListener("contact:preselect", onPreselect);
  }, []);

  // Deep links: /?contact=<type>#contact preselects the type on load.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("contact");
    if (type) {
      setProjectType(type);
      params.delete("contact");
      const clean = params.toString();
      window.history.replaceState({}, "", (clean ? `?${clean}` : window.location.pathname) + window.location.hash);
    }
  }, []);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("website")) {
      event.currentTarget.reset();
      return;
    }
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim();
    const company = String(form.get("company") ?? "").trim();
    const type = String(form.get("projectType") ?? "");
    const message = String(form.get("message")).trim();

    const subject = `Consulting Inquiry: ${type || "General"} - ${name}`;
    const body = `Name: ${name}
Email: ${email}${company ? `\nCompany: ${company}` : ""}${type ? `\nProject Type: ${type}` : ""}

Message:
${message}

---
Sent from James Reilly's portfolio website`;

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus(
      "Your email app should now open with the message pre-filled. If nothing happened, reach me on Matrix or LinkedIn instead.",
    );
  };

  const fieldError = (field: keyof Errors) =>
    errors[field] ? (
      <p id={`${field}-error`} className={errorClass}>
        {errors[field]}
      </p>
    ) : null;

  const describedBy = (field: keyof Errors) => (errors[field] ? `${field}-error` : undefined);

  return (
    <section id="contact" className="py-16 bg-earth-cream dark:bg-earth-brown">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">Get In Touch</h2>
          <p className="text-xl text-earth-brown dark:text-earth-cream max-w-2xl mx-auto">
            Want to work together? Here's how to reach me.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-6">Let's Connect</h3>
              <p className="text-earth-brown dark:text-earth-cream mb-6 leading-relaxed">
                Whether it's a consulting project, an open source collaboration, or just a question about bootc or Matrix — happy to chat.
              </p>
            </div>

            <div className="space-y-4">
              {contactMethods.map((method) => (
                <a
                  key={method.title}
                  href={method.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 bg-earth-cream dark:bg-earth-brown rounded-lg border border-earth-rust dark:border-earth-cream/20 hover:shadow-md hover:border-earth-teal dark:hover:border-earth-orange transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <method.icon className={`w-6 h-6 mr-4 shrink-0 ${method.color}`} aria-hidden="true" />
                  <div>
                    <div className="font-medium text-earth-brown dark:text-earth-cream">{method.title}</div>
                    <div className="text-sm text-earth-brown dark:text-earth-cream">{method.subtitle}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-earth-teal dark:bg-earth-rust border-earth-teal dark:border-earth-rust">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-xl font-heading font-semibold text-earth-cream mb-6">Send a Message</h3>

              <form onSubmit={onSubmit} noValidate className="space-y-5">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
                />
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className={labelClass}>Name</Label>
                  <Input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Your full name"
                    aria-invalid={!!errors.name}
                    aria-describedby={describedBy("name")}
                  />
                  {fieldError("name")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email" className={labelClass}>Email</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your.email@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={describedBy("email")}
                  />
                  {fieldError("email")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-company" className={labelClass}>Company (optional)</Label>
                  <Input id="contact-company" name="company" autoComplete="organization" placeholder="Your organization" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-type" className={labelClass}>Project Type</Label>
                  <select
                    id="contact-type"
                    name="projectType"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select project type</option>
                    {projectTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message" className={labelClass}>Message</Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    placeholder="Tell me about your project requirements..."
                    rows={4}
                    aria-invalid={!!errors.message}
                    aria-describedby={describedBy("message")}
                  />
                  {fieldError("message")}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-earth-orange text-earth-brown font-semibold hover:bg-earth-cream"
                >
                  Send via email
                </Button>
              </form>

              <p role="status" aria-live="polite" className="mt-4 text-sm text-earth-cream empty:hidden">
                {status}
              </p>

              <p className="mt-6 flex items-start justify-center gap-2 text-center text-sm text-earth-cream">
                <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>This opens your email app with the message pre-filled — nothing is sent through this website.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
