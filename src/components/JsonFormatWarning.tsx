import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface JsonFormatWarningProps {
  jsonAcknowledged: boolean;
  onAcknowledgeChange: (checked: boolean) => void;
}

export function JsonFormatWarning({
  jsonAcknowledged,
  onAcknowledgeChange,
}: JsonFormatWarningProps) {
  return (
    <div className="space-y-5">
      {/* Supported vs Unsupported Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Green JSON Supported Card */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-950">
                JSON Format — Supported
              </h3>
              <p className="text-xs text-emerald-800">
                Required for accurate, verified analysis
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-xs text-emerald-900">
            <li className="flex items-start gap-2">
              <span className="font-mono text-emerald-700 shrink-0">✓</span>
              <span>
                Contains structured{' '}
                <code className="font-mono text-[11px] bg-white/80 px-1 py-0.5 rounded border border-emerald-200">
                  followers_1.json
                </code>
                ,{' '}
                <code className="font-mono text-[11px] bg-white/80 px-1 py-0.5 rounded border border-emerald-200">
                  followers_2.json
                </code>{' '}
                and{' '}
                <code className="font-mono text-[11px] bg-white/80 px-1 py-0.5 rounded border border-emerald-200">
                  following.json
                </code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-emerald-700 shrink-0">✓</span>
              <span>Date Range set to All time captures every historical follower</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-emerald-700 shrink-0">✓</span>
              <span>Parses thousands of accounts accurately with exact counts</span>
            </li>
          </ul>
        </div>

        {/* Red HTML Unsupported Card */}
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-950">
                HTML Format — Unsupported
              </h3>
              <p className="text-xs text-red-800">
                Cannot be uploaded or analyzed
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-xs text-red-900">
            <li className="flex items-start gap-2">
              <span className="font-mono text-red-700 shrink-0">✕</span>
              <span>
                Exports web pages like{' '}
                <code className="font-mono text-[11px] bg-white/80 px-1 py-0.5 rounded border border-red-200">
                  followers_1.html
                </code>{' '}
                and{' '}
                <code className="font-mono text-[11px] bg-white/80 px-1 py-0.5 rounded border border-red-200">
                  following.html
                </code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-red-700 shrink-0">✕</span>
              <span>Instagram selects HTML by default unless you switch to JSON</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-red-700 shrink-0">✕</span>
              <span>HTML files are rejected to prevent inaccurate or incomplete results</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Warning Notice + Mandatory Acknowledgement Checkbox */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-950">
              Confirm your Instagram export format before analyzing
            </p>
            <p className="mt-1 text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              HTML exports are unsupported. Verify that you selected{' '}
              <strong className="font-semibold text-amber-950">Format: JSON</strong> and{' '}
              <strong className="font-semibold text-amber-950">Date Range: All time</strong>{' '}
              when requesting your Instagram ZIP file.
            </p>

            <label
              htmlFor="json-format-acknowledgement"
              className="mt-4 inline-flex items-center gap-3 cursor-pointer select-none group min-h-[40px]"
            >
              <input
                id="json-format-acknowledgement"
                type="checkbox"
                checked={jsonAcknowledged}
                onChange={(e) => onAcknowledgeChange(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-400 text-violet-600 accent-violet-600 focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 cursor-pointer shrink-0"
              />
              <span className="text-sm font-semibold text-zinc-950 group-hover:text-violet-800 transition-colors">
                I have selected JSON format
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
