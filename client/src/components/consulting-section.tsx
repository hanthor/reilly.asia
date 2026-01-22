import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Wrench, BookOpen, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConsultingSection() {
    const services = [
        {
            icon: Wrench,
            title: "Infrastructure Design",
            description: "Architecture planning and implementation guidance for robust, scalable systems.",
            features: ["System Architecture", "Capacity Planning", "Security Design"]
        },
        {
            icon: BookOpen,
            title: "Training & Education",
            description: "Team workshops and knowledge transfer sessions to empower your staff.",
            features: ["Custom Workshops", "Documentation", "Best Practices"]
        },
        {
            icon: Rocket,
            title: "Implementation Support",
            description: "Hands-on deployment and optimization assistance to ensure success.",
            features: ["Deployment Assistance", "Performance Tuning", "Troubleshooting"]
        }
    ];

    return (
        <section id="consulting" className="py-16 bg-white dark:bg-background">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">Consulting Services</h2>
                    <p className="text-xl text-earth-brown/80 dark:text-earth-cream/80 max-w-3xl mx-auto">
                        Leveraging deep technical expertise to solve complex infrastructure challenges
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <Card key={index} className="flex flex-col border-earth-rust/20 hover:border-earth-teal transition-colors bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
                            <CardHeader>
                                <service.icon className="w-8 h-8 text-earth-teal dark:text-earth-orange mb-4" />
                                <CardTitle className="text-xl font-bold text-earth-brown dark:text-earth-cream">
                                    {service.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-earth-brown/80 dark:text-earth-cream/80 mb-6 flex-1">
                                    {service.description}
                                </p>
                                <ul className="space-y-3 mb-8">
                                    {service.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-start">
                                            <CheckCircle2 className="w-5 h-5 text-earth-teal dark:text-earth-orange mr-2 shrink-0" />
                                            <span className="text-sm text-earth-brown dark:text-earth-cream">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button className="w-full bg-earth-rust hover:bg-earth-rust/90 text-white dark:bg-earth-orange dark:text-earth-brown mt-auto group">
                                    Get in Touch
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
