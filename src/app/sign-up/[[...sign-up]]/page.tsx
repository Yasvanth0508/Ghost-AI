import { SignUp } from "@clerk/nextjs";
import { Cpu, GitBranch, ShieldCheck, Sparkles } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full bg-base text-primary">
      {/* Left panel: Minimal Info (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-border bg-surface p-12">
        <div>
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="h-6 w-6 text-brand" />
            <span className="text-xl font-bold tracking-tight text-primary">GhostAI</span>
          </div>
          <p className="mt-4 text-base text-secondary">
            AI-powered collaborative workspace for technical system design and architecture graphs.
          </p>
        </div>

        <div className="space-y-6 my-auto py-8">
          <div className="flex items-start gap-3">
            <GitBranch className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">Real-Time Architecture Canvas</p>
              <p className="text-xs text-muted-foreground">Design system components, dataflows, and infrastructure topologies collaboratively.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Cpu className="h-5 w-5 text-accent-ai-text shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">AI-Assisted Graph Generation</p>
              <p className="text-xs text-muted-foreground">Generate comprehensive architecture diagrams and technical specifications automatically.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-state-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">Secure Multi-Tenant Workspaces</p>
              <p className="text-xs text-muted-foreground">Granular project access, secure token exchange, and persistent artifact storage.</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Built for software architects, engineering leads, and distributed teams.
        </div>
      </div>

      {/* Right panel: Centered Clerk form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <SignUp />
      </div>
    </div>
  );
}
