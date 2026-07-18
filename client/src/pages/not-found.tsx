import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-earth-cream dark:bg-earth-brown">
      <Card className="w-full max-w-md mx-4 bg-earth-cream dark:bg-earth-brown dark:border-earth-rust">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-earth-rust" />
            <h1 className="text-2xl font-heading font-bold text-earth-brown dark:text-earth-cream">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-earth-brown dark:text-earth-cream">
            The page you're looking for doesn't exist.
          </p>

          <Button asChild className="mt-6 bg-earth-teal hover:bg-earth-teal/90 text-earth-cream">
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
