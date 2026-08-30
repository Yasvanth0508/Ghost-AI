import { SignUp } from "@clerk/nextjs";
import { BrainCircuit, ScrollText, Share2 } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full bg-base text-primary">
      {/* Left panel: Product Branding & Features (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 border-r border-border bg-base">
        {/* Top Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-black font-bold text-sm">
            G
          </div>
          <span className="text-sm font-semibold tracking-tight text-primary">
            Ghost AI
          </span>
        </div>

        {/* Main Pitch & Feature List */}
        <div className="my-auto max-w-lg space-y-8 py-10">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-primary leading-[1.15]">
              Design systems at the <br />
              speed of thought.
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-md">
              Describe your architecture in plain English. Ghost AI maps it to a shared canvas your whole team can refine in real time.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="space-y-6 pt-2">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-dim text-brand">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  AI Architecture Generation
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Describe your system, AI maps it to nodes and edges on a live canvas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-dim text-brand">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Real-time Collaboration
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Live cursors, presence indicators, and shared node editing across your team.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-dim text-brand">
                <ScrollText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Instant Spec Generation
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Export a complete Markdown technical spec directly from the canvas graph.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom subtle text */}
        <div className="text-xs text-text-faint">
          © {new Date().getFullYear()} Ghost AI. All rights reserved.
        </div>
      </div>

      {/* Right panel: Centered Clerk form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-base">
        <SignUp />
      </div>
    </div>
  );
}
