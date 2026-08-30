import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-primary">
        <ClerkProvider
          appearance={{
            theme: shadcn,
            variables: {
              colorPrimary: "var(--accent-primary)",
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
                "bg-brand text-[#080809] font-semibold hover:bg-brand/90 transition-colors rounded-xl",
              socialButtonsBlockButton:
                "bg-elevated border border-border text-primary hover:bg-subtle transition-colors rounded-xl",
              socialButtonsBlockButtonText: "text-xs font-medium text-primary",
              formFieldLabel: "text-xs font-medium text-primary",
              formFieldInput:
                "bg-elevated border-border text-primary placeholder:text-muted rounded-xl focus:border-brand focus:ring-brand",
              footerActionText: "text-xs text-muted-foreground",
              footerActionLink: "text-xs text-brand hover:underline font-medium",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}