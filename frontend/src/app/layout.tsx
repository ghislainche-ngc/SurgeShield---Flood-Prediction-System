import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Brand-matched Clerk theme — applied globally so <SignIn>/<SignUp> and the
// user button inherit SurgeShield's palette and fonts.
const clerkAppearance = {
  variables: {
    colorPrimary: "#0d9488", // teal
    colorText: "#1c1c1c", // charcoal
    colorBackground: "#ffffff",
    colorInputBackground: "#faf7f2", // cream
    colorInputText: "#1c1c1c",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-inter)",
  },
  elements: {
    headerTitle: "font-heading text-forest",
    formButtonPrimary:
      "bg-teal hover:bg-teal/90 text-white normal-case font-medium",
    footerActionLink: "text-teal hover:text-teal/80",
    card: "shadow-lg shadow-forest/5 border border-forest/10",
  },
};

// Headings — serif
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Body — sans
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SurgeShield — AI-Powered Flood Prediction & Analytics",
  description:
    "SurgeShield is an AI-powered flood prediction and analytics system: real-time risk scoring, interactive maps, and transparent model metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html
        lang="en"
        className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-cream text-charcoal font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
