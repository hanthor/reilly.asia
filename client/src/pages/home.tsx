import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import ExpertiseSection from "@/components/expertise-section";
import ConsultingSection from "@/components/consulting-section";
import ExperienceSection from "@/components/experience-section";
import ProjectsSection from "@/components/projects-section";
import TalksSection from "@/components/talks-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <HeroSection />
      <ExpertiseSection />
      <ConsultingSection />
      <ExperienceSection />
      <ProjectsSection />
      <TalksSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
