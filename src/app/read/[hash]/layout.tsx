import type { Metadata } from "next";

// This page shows private emergency information: keep it out of search engines and out of Referer headers.
export const metadata: Metadata = {
  title: "Emergency information",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
