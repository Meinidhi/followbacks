interface FooterProps {
  onNavigateToSection: (sectionId: string) => void;
}

export function Footer({ onNavigateToSection }: FooterProps) {
  return (
    <footer className="bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p
              className="text-base font-bold tracking-tight text-zinc-950"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              FOLLOWBACK
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Instagram Follow Analyzer · Know who follows you back.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-zinc-600"
          >
            <a
              href="#instructions"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToSection('instructions');
              }}
              className="hover:text-zinc-950 transition-colors"
            >
              Download Instructions
            </a>
            <a
              href="#analyze"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToSection('analyze');
              }}
              className="hover:text-zinc-950 transition-colors"
            >
              Analyze ZIP
            </a>
            <a
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToSection('privacy');
              }}
              className="hover:text-zinc-950 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToSection('faq');
              }}
              className="hover:text-zinc-950 transition-colors"
            >
              FAQ
            </a>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500">
          <p>
            100% local browser processing. Not affiliated with or endorsed by Instagram or Meta.
          </p>
          <p className="font-mono">FOLLOWBACK — Know who follows you back</p>
        </div>
      </div>
    </footer>
  );
}
