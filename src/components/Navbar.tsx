import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  hasResults: boolean;
  onNavigateToSection: (sectionId: string) => void;
  onAnalyzeCtaClick: () => void;
}

export function Navbar({
  hasResults,
  onNavigateToSection,
  onAnalyzeCtaClick,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigateToSection(sectionId);
  };

  const handleCta = () => {
    setMobileMenuOpen(false);
    onAnalyzeCtaClick();
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('top');
          }}
          className="font-bold text-lg tracking-tight text-zinc-950 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 rounded"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          FOLLOWBACK
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          <a
            href="#instructions"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('instructions');
            }}
            className="hover:text-zinc-950 transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-zinc-300"
          >
            How It Works
          </a>
          <a
            href={hasResults ? '#results' : '#analyze'}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(hasResults ? 'results' : 'analyze');
            }}
            className="hover:text-zinc-950 transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-zinc-300"
          >
            {hasResults ? 'Results' : 'Analyze'}
          </a>
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('privacy');
            }}
            className="hover:text-zinc-950 transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-zinc-300"
          >
            Privacy
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('faq');
            }}
            className="hover:text-zinc-950 transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-zinc-300"
          >
            FAQ
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCta}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
          >
            {hasResults ? 'View Dashboard' : 'Analyze My Instagram'}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 pt-2 pb-4 shadow-sm">
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => handleNavClick('instructions')}
              className="text-left px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => handleNavClick(hasResults ? 'results' : 'analyze')}
              className="text-left px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg"
            >
              {hasResults ? 'Results' : 'Analyze'}
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('privacy')}
              className="text-left px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('faq')}
              className="text-left px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg"
            >
              FAQ
            </button>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCta}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
              >
                {hasResults ? 'View Dashboard' : 'Analyze My Instagram'}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
