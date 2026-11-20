import { motion } from 'motion/react';
import { ArrowRight, Lock, CheckCheck, Zap, BookOpen } from 'lucide-react';

interface LandingPageProps {
  onAnalyzeClick: () => void;
  onInstructionsClick: () => void;
}

const FEATURES = [
  {
    title: 'Privacy',
    description:
      'Every ZIP archive is unpacked and compared strictly inside your browser memory. No Instagram password, login, external API, or server upload ever happens.',
    detail: '100% browser-local execution',
    icon: Lock,
  },
  {
    title: 'Accurate Comparison',
    description:
      'Dynamically locates connections/followers_and_following, reads every followers_*.json split file and following.json, deduplicates usernames, and computes exact set differences.',
    detail: 'Multi-file JSON & schema-aware',
    icon: CheckCheck,
  },
  {
    title: 'Instant Results',
    description:
      'Process thousands of followers in milliseconds with real-time search, A–Z and Z–A sorting, visual relationship breakdowns, direct profile links, and clean UTF-8 CSV exports.',
    detail: 'Zero wait, instant CSV export',
    icon: Zap,
  },
];

export function LandingPage({
  onAnalyzeClick,
  onInstructionsClick,
}: LandingPageProps) {
  return (
    <section
      id="top"
      className="relative bg-white border-b border-zinc-200 overflow-hidden"
    >
      {/* Subtle architectural background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:28px_28px] opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-violet-50/60 via-white/80 to-transparent"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-24">
        {/* Hero Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-sm font-medium text-violet-700 mb-4 tracking-tight">
            Know who follows you back
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 leading-[1.08] text-balance">
            Find out who doesn&apos;t follow you back
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            Upload your official Instagram JSON data export to instantly compare your
            followers and following lists. Runs completely in your browser with zero
            passwords, logins, or tracking.
          </p>

          {/* Primary Focal Anchor CTA */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onAnalyzeClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
            >
              <span>Analyze My Instagram</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onInstructionsClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
            >
              <BookOpen className="w-4 h-4 text-zinc-500" />
              <span>View Download Instructions</span>
            </button>
          </div>

          {/* Unboxed trust metadata */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-zinc-500">
            <span>No Instagram login</span>
            <span aria-hidden="true">·</span>
            <span>Local JSZip processing</span>
            <span aria-hidden="true">·</span>
            <span>JSON format required</span>
            <span aria-hidden="true">·</span>
            <span>CSV export included</span>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.06 * (index + 1),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between hover:border-zinc-300 transition-colors duration-150"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700 mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-950 tracking-tight">
                    {feature.title}
                  </h2>
                  <p className="mt-2.5 text-sm text-zinc-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <p className="mt-5 pt-4 border-t border-zinc-100 text-xs font-medium text-zinc-500">
                  {feature.detail}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
