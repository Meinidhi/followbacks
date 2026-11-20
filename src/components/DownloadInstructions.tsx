import { ChevronRight, Check, AlertTriangle, Smartphone, SlidersHorizontal } from 'lucide-react';

interface InstructionStep {
  stepNumber: number;
  title: string;
  detail: string;
}

const DOWNLOAD_STEPS: InstructionStep[] = [
  {
    stepNumber: 1,
    title: 'Profile',
    detail: 'Open the Instagram app or instagram.com and navigate to your Profile tab.',
  },
  {
    stepNumber: 2,
    title: 'Menu',
    detail: 'Tap the three-line Menu icon in the top-right corner of your profile.',
  },
  {
    stepNumber: 3,
    title: 'Accounts Center',
    detail: 'Select Accounts Center at the top of Settings and privacy.',
  },
  {
    stepNumber: 4,
    title: 'Your information and permissions',
    detail: 'Under Account settings, tap Your information and permissions.',
  },
  {
    stepNumber: 5,
    title: 'Download your information',
    detail: 'Choose Download your information to request an official Meta archive.',
  },
  {
    stepNumber: 6,
    title: 'Download or transfer information',
    detail: 'Click Download or transfer information to create a new export request.',
  },
  {
    stepNumber: 7,
    title: 'Select account',
    detail: 'Check the specific Instagram account you want to analyze, then tap Next.',
  },
  {
    stepNumber: 8,
    title: 'Some of your information',
    detail: 'Pick Some of your information so your download finishes in minutes instead of hours.',
  },
  {
    stepNumber: 9,
    title: 'Followers and following',
    detail: 'Scroll to Connections, check only Followers and following, and tap Next.',
  },
  {
    stepNumber: 10,
    title: 'Download to device',
    detail: 'Choose Download to device, set Format to JSON and Date Range to All time, then create files.',
  },
];

export function DownloadInstructions() {
  return (
    <section
      id="instructions"
      className="py-16 sm:py-20 bg-zinc-50/70 border-b border-zinc-200 scroll-mt-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-violet-700">Step-by-step guide</p>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 text-balance">
            How to download your Instagram data in JSON format
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed">
            Follow the exact path inside Instagram Accounts Center below. Exporting only
            Followers and following typically takes just 1–5 minutes.
          </p>
        </div>

        {/* Visual Navigation Breadcrumb Path */}
        <div className="mt-8 bg-white border border-zinc-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-3">
            <Smartphone className="w-4 h-4 text-violet-600 shrink-0" />
            <span>Exact Instagram navigation path</span>
          </div>
          <ol className="flex flex-wrap items-center gap-y-2 gap-x-1.5 text-xs sm:text-sm font-medium text-zinc-800">
            {DOWNLOAD_STEPS.map((step, index) => (
              <li key={step.stepNumber} className="inline-flex items-center gap-1.5">
                <span className={step.stepNumber >= 9 ? 'text-violet-700 font-semibold' : ''}>
                  {step.title}
                </span>
                {index < DOWNLOAD_STEPS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* 10 Visual Step Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {DOWNLOAD_STEPS.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono tabular-nums text-xs font-semibold text-violet-700">
                    {String(step.stepNumber).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-950 leading-snug">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory Download Settings Visual Inspector */}
        <div className="mt-8 bg-white border border-zinc-200 rounded-xl p-6 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                <SlidersHorizontal className="w-4 h-4 text-violet-600 shrink-0" />
                <span>Mandatory download settings before tapping Create files</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                On the final <strong className="font-semibold text-zinc-900">Download to device</strong> screen,
                Instagram defaults to HTML and Last year. You must change both settings below
                for FOLLOWBACK to read your complete account history.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-[460px] shrink-0">
              {/* Format Setting */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-800">Format</span>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <p className="mt-1.5 font-mono text-base font-semibold text-emerald-950">
                  JSON
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  Change from HTML to JSON
                </p>
              </div>

              {/* Date Range Setting */}
              <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-violet-800">Date range</span>
                  <Check className="w-4 h-4 text-violet-600 shrink-0" />
                </div>
                <p className="mt-1.5 font-mono text-base font-semibold text-violet-950">
                  All time
                </p>
                <p className="mt-1 text-xs text-violet-800">
                  Required for full follower list
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-start gap-2.5 text-xs text-zinc-600">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Once Instagram emails you that your download is ready, save the{' '}
              <span className="font-mono text-zinc-900">.zip</span> archive to your device and
              upload it directly below — do not unzip or edit any files inside.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
