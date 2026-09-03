import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Design systems at the speed of thought. AI-powered technical architecture workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${oswald.variable} ${oswald.className} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-base text-primary font-sans"
      >
        <ClerkProvider
          appearance={{
            theme: shadcn,
            variables: {
              colorPrimary: "#00A300",
              colorBackground: "var(--bg-surface)",
              colorDanger: "var(--state-error)",
              colorSuccess: "var(--state-success)",
              colorWarning: "var(--state-warning)",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "bg-surface border border-border rounded-3xl shadow-2xl",
              headerTitle: "text-lg font-bold text-primary",
              headerSubtitle: "text-xs text-muted-foreground",
              formButtonPrimary:
                "bg-[#00A300] text-black font-bold hover:bg-[#00A300]/90 transition-all rounded-xl shadow-sm",
              socialButtonsBlockButton:
                "bg-elevated border border-border text-primary hover:bg-subtle transition-colors rounded-xl",
              socialButtonsBlockButtonText: "text-xs font-medium text-primary",
              formFieldLabel: "text-xs font-medium text-primary",
              formFieldInput:
                "bg-elevated border-border text-primary placeholder:text-muted rounded-xl focus:border-[#00A300] focus:ring-[#00A300]",
              footerActionText: "text-xs text-muted-foreground",
              footerActionLink: "text-xs text-[#00A300] hover:underline font-semibold",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}