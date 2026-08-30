import Link from "next/link";
import { entries } from "../data";

export async function generateStaticParams() {
  return entries.map((entry) => ({ slug: entry.slug }));
}

export default async function JournalEntry({ params }) {
  const resolvedParams = await params;
  const entry = entries.find((e) => e.slug === resolvedParams.slug);

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF6ED" }}>
        <div className="text-center">
          <p style={{ color: "#7D6B58", fontFamily: "Georgia, serif" }}>Entry not found.</p>
          <Link href="/journals" className="text-sm underline mt-4 block" style={{ color: "#2F4F33" }}>
            Back to The Journals
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = entries.findIndex((e) => e.slug === entry.slug);
  const prevEntry = entries[currentIndex + 1] || null;
  const nextEntry = entries[currentIndex - 1] || null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6ED" }}>
      {/* Nav */}
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
          <Link href="/journals" className="text-sm" style={{ color: "#7D6B58", fontFamily: "Georgia, serif" }}>
            All Entries
          </Link>
        </div>
      </nav>

      {/* Entry */}
      <article className="max-w-2xl mx-auto px-6 pt-12 pb-16">
        <Link
          href="/journals"
          className="text-xs tracking-widest uppercase mb-8 inline-block hover:opacity-70 transition-opacity"
          style={{ color: "#7D6B58", fontFamily: "monospace" }}
        >
          &larr; The Journals
        </Link>

        <time
          className="text-xs tracking-widest uppercase block mb-4"
          style={{ color: "#7D6B58", fontFamily: "monospace" }}
        >
          {new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          })}
        </time>

        <h1
          className="text-3xl sm:text-4xl md:text-5xl mb-2 italic"
          style={{
            fontFamily: "'Caveat', cursive",
            color: "#2F4F33",
            fontWeight: 700,
            letterSpacing: "-0.02em"
          }}
        >
          {entry.title}
        </h1>

        <div className="w-12 h-px mt-4 mb-10" style={{ backgroundColor: "#7D6B58" }}></div>

        <div className="space-y-6">
          {entry.body.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              style={{
                color: "#3A4045",
                fontFamily: "Georgia, serif",
                fontSize: "1.1rem",
                lineHeight: "2"
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Prev / Next */}
        <div className="mt-16 pt-8 flex justify-between items-start" style={{ borderTop: "1px solid #D2C6B2" }}>
          <div>
            {prevEntry && (
              <Link
                href={`/journals/${prevEntry.slug}`}
                className="group"
              >
                <span className="text-xs tracking-widest uppercase block mb-1" style={{ color: "#7D6B58", fontFamily: "monospace" }}>
                  Older
                </span>
                <span
                  className="text-lg italic group-hover:opacity-70 transition-opacity"
                  style={{ fontFamily: "'Caveat', cursive", color: "#2F4F33", fontWeight: 700 }}
                >
                  {prevEntry.title}
                </span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {nextEntry && (
              <Link
                href={`/journals/${nextEntry.slug}`}
                className="group"
              >
                <span className="text-xs tracking-widest uppercase block mb-1" style={{ color: "#7D6B58", fontFamily: "monospace" }}>
                  Newer
                </span>
                <span
                  className="text-lg italic group-hover:opacity-70 transition-opacity"
                  style={{ fontFamily: "'Caveat', cursive", color: "#2F4F33", fontWeight: 700 }}
                >
                  {nextEntry.title}
                </span>
              </Link>
            )}
          </div>
        </div>
      </article>

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
