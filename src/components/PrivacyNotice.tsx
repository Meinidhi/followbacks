import { ShieldCheck, Cpu, ServerOff, KeyRound, EyeOff, RotateCcw } from 'lucide-react';

const PRIVACY_GUARANTEES = [
  {
    title: 'No Instagram password or login',
    description:
      'You never enter your Instagram credentials or grant third-party OAuth access. Your account stays completely safe from login flags or automation bans.',
    icon: KeyRound,
  },
  {
    title: '100% browser-local ZIP processing',
    description:
      'Your ZIP file is unpacked and parsed directly inside your browser using JSZip and the standard Browser File API. Nothing leaves your computer or phone.',
    icon: Cpu,
  },
  {
    title: 'No backend, database, or API calls',
    description:
      'FOLLOWBACK has no server upload endpoint, no database, and no external Instagram API requests. Usernames and files are never transmitted externally.',
    icon: ServerOff,
  },
  {
    title: 'Zero tracking or persistence',
    description:
      'Analysis results live strictly in volatile in-memory state. Refreshing the page or clicking Clear Data wipes every parsed username and revokes all temporary download URLs.',
    icon: RotateCcw,
  },
];

export function PrivacyNotice() {
  return (
    <section
      id="privacy"
      className="py-16 sm:py-20 bg-white border-b border-zinc-200 scroll-mt-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Narrative */}
          <div className="lg:col-span-5">
            <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-violet-700">Privacy architecture</p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 text-balance">
              Your Instagram data never leaves your browser
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
              Unlike risky follower-tracker apps that ask for your Instagram password or
              upload your contact graph to remote servers, FOLLOWBACK runs entirely offline
              inside your browser tab.
            </p>
            <div className="mt-6 pt-5 border-t border-zinc-200 flex items-start gap-3 text-xs text-zinc-600">
              <EyeOff className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                You can even open your browser&apos;s Network inspector while analyzing a ZIP
                file to verify that zero file bytes or usernames are transmitted anywhere.
              </p>
            </div>
          </div>

          {/* Right Guarantee Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRIVACY_GUARANTEES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-5"
                >
                  <Icon className="w-5 h-5 text-violet-700 mb-3" />
                  <h3 className="text-sm font-semibold text-zinc-950">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
