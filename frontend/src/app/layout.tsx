import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
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

// metadataBase makes relative asset paths (e.g. the OG image) resolve to
// absolute URLs, and powers the canonical/Open Graph URLs Google reads to show
// the title + description snippet in search results.
const TITLE = "SurgeShield — AI-Powered Flood Prediction & Analytics";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · SurgeShield",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "flood prediction",
    "flood risk",
    "AI flood forecasting",
    "flood analytics",
    "machine learning",
    "early warning",
    "SurgeShield",
  ],
  authors: [{ name: "SurgeShield" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/hero.jpg",
        alt: "SurgeShield — AI-powered flood prediction and analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: ["/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  // Optional: paste the token from Google Search Console's "HTML tag"
  // verification method into NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION and rebuild.
  // (DNS-TXT verification needs no code — see deployment/README.md.)
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: { icon: "/favicon.ico" },
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
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
