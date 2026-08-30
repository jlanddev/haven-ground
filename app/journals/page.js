import Link from "next/link";
import { entries } from "./data";

export const metadata = {
  title: "The Journals | Haven Ground",
  robots: { index: false, follow: false }
};

export default function JournalsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6ED" }}>
      {/* Quiet nav back to site */}
      <nav className="max-w-2xl mx-auto px-6 pt-8 pb-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-sm tracking-wide uppercase"
          style={{ color: "#7D6B58", fontFamily: "Georgia, serif" }}
        >
          Haven Ground
        </Link>
        <div className="flex gap-6">
          <Link href="/properties" className="text-sm" style={{ color: "#7D6B58", fontFamily: "Georgia, serif" }}>
            Properties
          </Link>
          <Link href="/community" className="text-sm" style={{ color: "#7D6B58", fontFamily: "Georgia, serif" }}>
            Community
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="max-w-2xl mx-auto px-6 pt-12 pb-8">
        <h1
          className="text-4xl sm:text-5xl mb-3 italic"
          style={{
            fontFamily: "'Caveat', cursive",
            color: "#2F4F33",
            fontWeight: 700,
            letterSpacing: "-0.02em"
          }}
        >
          The Journals
        </h1>
        <div className="w-12 h-px mb-4" style={{ backgroundColor: "#7D6B58" }}></div>
        <p className="text-sm leading-relaxed" style={{ color: "#7D6B58", fontFamily: "Georgia, serif" }}>
          Notes on life, business, and building something that matters.
        </p>
      </header>

      {/* Entries */}
      <main className="max-w-2xl mx-auto px-6 pb-24">
        {entries.map((entry, i) => (
          <div key={entry.slug}>
            {i > 0 && (
              <div className="my-10 flex items-center gap-4">
                <div className="flex-1 h-px" style={{ backgroundColor: "#D2C6B2" }}></div>
              </div>
            )}
            <Link href={`/journals/${entry.slug}`} className="block group">
              <time
                className="text-xs tracking-widest uppercase block mb-3"
                style={{ color: "#7D6B58", fontFamily: "monospace" }}
              >
                {new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </time>
              <h2
                className="text-2xl sm:text-3xl mb-4 italic group-hover:opacity-70 transition-opacity"
                style={{
                  fontFamily: "'Caveat', cursive",
                  color: "#2F4F33",
                  fontWeight: 700,
                  letterSpacing: "-0.01em"
                }}
              >
                {entry.title}
              </h2>
              <p
                className="leading-relaxed line-clamp-3"
                style={{
                  color: "#3A4045",
                  fontFamily: "Georgia, serif",
                  fontSize: "1.05rem",
                  lineHeight: "1.85"
                }}
              >
                {entry.body.split("\n\n")[0]}
              </p>
            </Link>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-6 pb-12">
        <div className="h-px mb-8" style={{ backgroundColor: "#D2C6B2" }}></div>
        <p
          className="text-xs tracking-wide"
          style={{ color: "#7D6B58", fontFamily: "Georgia, serif" }}
        >
          JH
        </p>
      </footer>
    </div>
  );
}
