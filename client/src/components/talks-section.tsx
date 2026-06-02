import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Video, Mic } from "lucide-react";

export default function TalksSection() {
    const talks = [
        {
            title: "Report from a Slop Factory: LLMs and FOSS",
            event: "LucknowFOSS 2.0",
            type: "Talk",
            date: "04 Apr 2026",
            location: "IIIT Lucknow",
            url: "https://fossunited.org/c/lucknow/2026/cfp/610ledko8u"
        },
        {
            title: "Self-hosting Matrix and other LAN-based fun",
            event: "Lucknow November Meetup",
            type: "Workshop",
            date: "15 Nov 2025",
            location: "IIIT Lucknow",
            url: "https://fossunited.org/c/lucknow/nov-2025/cfp/0s2n6jfh9v"
        },
        {
            title: "Bootable Containers: Future of the Linux Desktop",
            event: "IndiaFOSS 2025",
            type: "Talk",
            date: "20 Sep 2025",
            location: "NIMHANS, Bengaluru",
            url: "https://fossunited.org/c/indiafoss/2025/cfp/3lnendkm8e"
        },
        {
            title: "GitDevOps: A practical exploration",
            event: "Mysore FOSS Meetup",
            type: "Talk",
            date: "09 Aug 2025",
            location: "Online",
            url: "https://fossunited.org/c/mysore/FOSSMys-Aug/cfp/80akrtu3nf"
        },
        {
            title: "Bootable Containers: Redux",
            event: "Lucknow August Meetup",
            type: "Talk",
            date: "02 Aug 2025",
            location: "IIIT Lucknow",
            url: "https://fossunited.org/c/lucknow/2025/august/cfp/1i4adm6jbm"
        },
        {
            title: "Fireside Chat with Kailash Nadh",
            event: "LucknowFOSS",
            type: "Panel",
            date: "12 Apr 2025",
            location: "IIIT Lucknow",
            url: "https://fossunited.org/c/lucknow/2025/cfp/2ok5qlec77"
        },
        {
            title: "FOSS and Curiosity: How I grew my career pursuing interests in Open Source",
            event: "BiharFOSS 2025",
            type: "Talk",
            date: "22 Mar 2025",
            location: "IIT Patna",
            url: "https://fossunited.org/c/bihar/2025/cfp/mfvun6uns2"
        },
        {
            title: "Atomic Desktops and Bootable Containers: The future of Linux on the Desktop",
            event: "Lucknow January Meetup",
            type: "Talk",
            date: "25 Jan 2025",
            location: "IIIT Lucknow",
            url: "https://fossunited.org/c/lucknow/2025/jan/cfp/4fikk831lk"
        },
        {
            title: "The Future of the Linux Desktop? Atomic Images and Bootable Containers",
            event: "FOSS Meetup Kanpur",
            type: "Workshop",
            date: "11 Jan 2025",
            location: "Jagran Institute, Kanpur",
            url: "https://fossunited.org/c/kanpur/2025-jan/cfp/fl4i1ao6a6"
        },
        {
            title: "Matrix: How to disrupt the communication industry with a FOSS alternative",
            event: "Lucknow FOSS Meetup",
            type: "Talk",
            date: "12 Jul 2024",
            location: "Goel Institute, Lucknow",
            url: "https://fossunited.org/c/lucknow/lucknow-july-archive-3d88eecc/cfp/nq99e143jg"
        }
    ];

    return (
        <section id="talks" className="py-16 bg-earth-cream dark:bg-earth-brown">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-heading font-bold text-earth-brown dark:text-earth-cream mb-4">Speaking & Events</h2>
                    <p className="text-xl text-earth-brown dark:text-earth-cream max-w-3xl mx-auto">
                        Sharing knowledge and contributing to the global Open Source ecosystem
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {talks.map((talk, index) => (
                        <a
                            key={index}
                            href={talk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <Card className="h-full hover:shadow-lg transition-shadow bg-earth-teal dark:bg-earth-teal/30 border-earth-teal/50 dark:border-earth-cream/10 group-hover:border-earth-orange">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="secondary" className="bg-earth-cream/20 text-earth-cream hover:bg-earth-cream/30 border-0">
                                            {talk.type}
                                        </Badge>
                                    </div>

                                    <h3 className="text-lg font-heading font-semibold text-earth-cream mb-3 group-hover:text-earth-orange transition-colors">
                                        {talk.title}
                                    </h3>

                                    <div className="mt-auto space-y-2 text-sm text-earth-cream/80">
                                        <div className="flex items-center">
                                            <Mic className="w-4 h-4 mr-2 text-earth-orange" />
                                            {talk.event}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-earth-orange" />
                                            {talk.date}
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-earth-orange" />
                                            {talk.location}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
