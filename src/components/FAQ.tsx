import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Why do I have to select JSON format instead of HTML?',
    answer:
      'Instagram defaults to HTML format, which wraps your account lists in presentation web pages whose markup changes frequently. JSON format provides clean, structured data (followers_1.json, followers_2.json, following.json) so FOLLOWBACK can extract every username accurately without misreading timestamps or missing accounts.',
  },
  {
    question: 'Why must Date Range be set to All time?',
    answer:
      'If Date Range is left on Last year or a shorter period, Instagram only exports accounts you followed or gained during that window. Choosing All time ensures your complete follower and following lists are exported so comparison counts match your real account.',
  },
  {
    question: 'What if Instagram split my followers into multiple files (followers_1.json, followers_2.json)?',
    answer:
      'Accounts with larger follower counts automatically receive multiple split files inside connections/followers_and_following/. FOLLOWBACK dynamically scans the folder and merges every followers_*.json file automatically before deduplicating and comparing.',
  },
  {
    question: 'Is this safe for my Instagram account?',
    answer:
      'Yes. You never log into Instagram through FOLLOWBACK, never enter your password, and never run automated scraping against Instagram. You only analyze the official data export ZIP that Instagram provides to you in Accounts Center.',
  },
  {
    question: 'Does FOLLOWBACK store my usernames or ZIP file anywhere?',
    answer:
      'No. All ZIP unpacking, JSON parsing, set comparisons, and CSV generation happen strictly in your browser memory. Nothing is sent to a server, and nothing is stored in localStorage or cookies. Refreshing the page or clicking Clear Data immediately erases all data.',
  },
  {
    question: 'What does the exported CSV include?',
    answer:
      'Exporting CSV downloads the complete filtered list for your active tab (all matching accounts across all pages, in your current sort order) encoded in UTF-8 with Serial Number, Username, and Instagram Profile URL columns.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 bg-zinc-50/70 border-b border-zinc-200 scroll-mt-16"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-violet-700">Common questions</p>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Frequently asked questions
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-200">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-600"
                >
                  <span className="text-sm sm:text-base font-semibold text-zinc-950">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-violet-700' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 text-sm text-zinc-600 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
