import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/components/infra/infra.css";
import { InfraHeader } from "@/components/infra/header";
import { InfraHero } from "@/components/infra/hero";
import { StatusGrid } from "@/components/infra/status-grid";
import { Architecture } from "@/components/infra/architecture";
import { Automation } from "@/components/infra/automation";
import { Fleet } from "@/components/infra/fleet";
import { Stack } from "@/components/infra/stack";
import { InfraFooter } from "@/components/infra/footer";
import { useHostAnchors } from "@/components/infra/use-host-anchors";

const TITLE = "Infrastructure · James Reilly";
const DESCRIPTION =
  "A self-maintaining personal fleet and the TunaOS Kubernetes cluster on AWS: architecture, live status and the automation that keeps it running.";

function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    const prevDescription = meta.content;
    document.title = title;
    meta.content = description;
    return () => {
      document.title = prevTitle;
      if (created) meta!.remove();
      else meta!.content = prevDescription;
    };
  }, [title, description]);
}

// Only this page uses React Query, so its client lives here rather than in
// App.tsx — the home page's bundle stays free of it.
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

export default function Infra() {
  return (
    <QueryClientProvider client={queryClient}>
      <InfraPage />
    </QueryClientProvider>
  );
}

function InfraPage() {
  useDocumentMeta(TITLE, DESCRIPTION);
  useHostAnchors();
  return (
    <div className="infra min-h-screen font-sans antialiased">
      <InfraHeader />
      <main id="main">
        <InfraHero />
        <StatusGrid />
        <div className="border-y border-[color:var(--ix-line)] bg-[color:color-mix(in_srgb,var(--ix-surface-2)_55%,var(--ix-bg))]">
          <Architecture />
        </div>
        <Automation />
        <Fleet />
        <Stack />
      </main>
      <InfraFooter />
    </div>
  );
}
