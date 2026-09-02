import * as React from "react";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-base p-6 text-center text-primary">
      <div className="flex max-w-sm flex-col items-center rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-subtle text-muted-foreground">
          <Lock className="h-6 w-6 text-primary" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
          Access Denied
        </h1>

        <p className="mt-2 text-sm text-text-secondary">
          You don&apos;t have access to this project, or the project does not exist.
        </p>

        <div className="mt-6 w-full">
          <Button
            asChild
            className="w-full gap-2 rounded-xl bg-brand text-black font-semibold hover:bg-brand/90 transition-all shadow-sm"
          >
            <Link href="/editor">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Projects</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
