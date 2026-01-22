import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { contactFormSchema, type ContactFormData } from "@shared/schema";
import { Linkedin, Github, MessageSquare, Globe, Shield, Mail } from "lucide-react";

export default function ContactSection() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      projectType: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormData) => {
    setIsSubmitting(true);

    // Create mailto link with form data
    const subject = `Consulting Inquiry: ${data.projectType || 'General'} - ${data.name}`;
    const body = `Name: ${data.name}
Email: ${data.email}${data.company ? `\nCompany: ${data.company}` : ''}${data.projectType ? `\nProject Type: ${data.projectType}` : ''}

Message:
${data.message}

---
Sent from James Reilly's portfolio website`;

    const mailtoLink = `mailto:jreilly1821@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open mailto link
    window.location.href = mailtoLink;

    toast({
      title: "Opening email client...",
      description: "Your default email client should open with the message pre-filled.",
    });

    // Reset form after brief delay
    setTimeout(() => {
      form.reset();
      setIsSubmitting(false);
    }, 1000);
  };

  const contactMethods = [
    {
      icon: Linkedin,
      title: "LinkedIn",
      subtitle: "Professional Network",
      url: "https://www.linkedin.com/in/jreilly112/",
      color: "text-earth-teal"
    },
    {
      icon: Github,
      title: "GitHub",
      subtitle: "Open Source Projects",
      url: "https://github.com/hanthor",
      color: "text-earth-brown"
    },
    {
      icon: MessageSquare,
      title: "Matrix",
      subtitle: "@james:reilly.asia",
      url: "https://matrix.to/#/@james:reilly.asia",
      color: "text-earth-orange"
    }
  ];



  return (
    <section id="contact" className="py-16 bg-earth-cream dark:bg-earth-brown">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">Get In Touch</h2>
          <p className="text-xl text-earth-brown dark:text-earth-cream max-w-2xl mx-auto">
            Ready to discuss your infrastructure needs?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-heading font-semibold text-earth-brown dark:text-earth-cream mb-6">Let's Connect</h3>
              <p className="text-earth-brown dark:text-earth-cream mb-6 leading-relaxed">
                I'm always interested in discussing new projects, consulting opportunities,
                or collaborative ventures in infrastructure technology.
              </p>
            </div>

            <div className="space-y-4">
              {contactMethods.map((method, index) => (
                <a
                  key={index}
                  href={method.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 bg-earth-cream dark:bg-earth-brown rounded-lg border border-earth-rust dark:border-earth-cream/20 hover:shadow-sm transition-shadow"
                >
                  <method.icon className={`w-6 h-6 mr-4 ${method.color}`} />
                  <div>
                    <div className="font-medium text-earth-brown dark:text-earth-cream">{method.title}</div>
                    <div className="text-sm text-earth-brown dark:text-earth-cream">{method.subtitle}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-earth-teal dark:bg-earth-rust dark:border-earth-rust">
            <CardContent className="p-8">
              <h3 className="text-xl font-heading font-semibold text-earth-cream mb-6">Send a Message</h3>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-earth-cream dark:text-earth-cream">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-earth-cream">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-earth-cream">Company (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your organization" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-earth-cream">Project Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bootc">bootc Infrastructure</SelectItem>
                            <SelectItem value="matrix">Matrix Services</SelectItem>
                            <SelectItem value="sysadmin">Systems Administration</SelectItem>
                            <SelectItem value="consulting">General Consulting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-earth-cream">Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell me about your project requirements..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-earth-orange border-earth-rust hover:bg-earth-teal/90 text-white"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm text-earth-cream">
                <Shield className="w-4 h-4 inline mr-1" />
                Your information is secure and will never be shared.
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </section>
  );
}
