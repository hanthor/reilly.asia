import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

const Infra = lazy(() => import("@/pages/infra"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/infra">
        <Suspense fallback={null}>
          <Infra />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="portfolio-theme">
      <Router />
    </ThemeProvider>
  );
}

export default App;
