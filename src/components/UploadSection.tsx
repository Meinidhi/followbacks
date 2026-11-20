import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  UploadCloud,
  FileArchive,
  RefreshCw,
  Trash2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react';
import type { AnalyzerError, ZipProcessProgress } from '../types/analyzer';
import { formatFileSize } from '../utils/csvUtils';
import { validateSelectedFile } from '../utils/ZipProcessor';
import { JsonFormatWarning } from './JsonFormatWarning';

interface UploadSectionProps {
  selectedFile: File | null;
  jsonAcknowledged: boolean;
  isProcessing: boolean;
  progress: ZipProcessProgress | null;
  error: AnalyzerError | null;
  hasResults: boolean;
  onFileSelect: (file: File | null) => void;
  onValidationError: (error: AnalyzerError | null) => void;
  onAcknowledgeChange: (checked: boolean) => void;
  onAnalyze: () => void;
  onClearData: () => void;
  onViewInstructions: () => void;
}

const LARGE_FILE_THRESHOLD_BYTES = 100 * 1024 * 1024; // 100 MB advisory

export function UploadSection({
  selectedFile,
  jsonAcknowledged,
  isProcessing,
  progress,
  error,
  hasResults,
  onFileSelect,
  onValidationError,
  onAcknowledgeChange,
  onAnalyze,
  onClearData,
  onViewInstructions,
}: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!selectedFile && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFile]);

  const handleIncomingFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    const validationErr = validateSelectedFile(file);
    if (validationErr) {
      onFileSelect(null);
      onValidationError(validationErr);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    onValidationError(null);
    onFileSelect(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleIncomingFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) {
      return;
    }
    const file = e.dataTransfer.files?.[0];
    handleIncomingFile(file);
  };

  const openFilePicker = () => {
    if (isProcessing) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    onValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canAnalyze = Boolean(selectedFile) && jsonAcknowledged && !isProcessing;
  const isLargeFile = Boolean(
    selectedFile && selectedFile.size >= LARGE_FILE_THRESHOLD_BYTES
  );

  return (
    <section
      id="analyze"
      className="py-16 sm:py-20 bg-white border-b border-zinc-200 scroll-mt-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-violet-700">Local ZIP analyzer</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Upload your Instagram JSON ZIP file
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Files are processed directly in your browser using JSZip and never leave your device.
            </p>
          </div>

          {(selectedFile || hasResults || error) && (
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                onClearData();
              }}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Clear Data</span>
            </button>
          )}
        </div>

        {/* JSON Format Support Cards & Mandatory Checkbox */}
        <JsonFormatWarning
          jsonAcknowledged={jsonAcknowledged}
          onAcknowledgeChange={onAcknowledgeChange}
        />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleInputChange}
          aria-label="Upload Instagram ZIP archive"
          className="sr-only"
        />

        {/* Drag & Drop Upload Zone or Selected File Summary */}
        <div className="mt-6">
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFilePicker}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              aria-label="Drop your Instagram JSON ZIP file here or click to browse"
              className={`rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${
                isDragging
                  ? 'border-violet-500 bg-violet-50/60'
                  : 'border-zinc-300 bg-zinc-50/40 hover:border-violet-400 hover:bg-zinc-50'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center mx-auto text-violet-600">
                <UploadCloud className="w-6 h-6" />
              </div>

              <p className="mt-4 text-base font-semibold text-zinc-950">
                {isDragging
                  ? 'Drop your Instagram .zip file here'
                  : 'Drag and drop your Instagram ZIP archive here'}
              </p>
              <p className="mt-1.5 text-sm text-zinc-500">
                or browse from your device · Supports single or multi-part{' '}
                <span className="font-mono text-xs text-zinc-700">followers_*.json</span>
              </p>

              <div className="mt-6">
                <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
                  Browse ZIP File
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-700 shrink-0">
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-950 truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 font-mono tabular-nums">
                      <span>{formatFileSize(selectedFile.size)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">ZIP Archive ready</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {isLargeFile && !isProcessing && (
                <div className="mt-4 pt-4 border-t border-zinc-200 flex items-start gap-2.5 text-xs text-zinc-600">
                  <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <p>
                    This archive is large ({formatFileSize(selectedFile.size)}). Because
                    everything runs locally in your browser, unpacking may take a few seconds.
                    For faster exports next time, select only &ldquo;Followers and following&rdquo;.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Processing Progress Indicator */}
        {isProcessing && progress && (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 rounded-xl border border-violet-200 bg-violet-50/50 p-5"
          >
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2.5 font-medium text-violet-950">
                <Loader2 className="w-4 h-4 text-violet-600 animate-spin shrink-0" />
                <span>{progress.message}</span>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-violet-700 shrink-0">
                {progress.percent}%
              </span>
            </div>
            <div className="mt-3 h-2 w-full bg-violet-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Friendly Error Banner (including dedicated HTML Export Error) */}
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50/70 p-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-950">{error.title}</h3>
                <p className="mt-1 text-sm text-red-900 leading-relaxed">
                  {error.message}
                </p>
                {error.suggestion && (
                  <p className="mt-2 text-xs text-red-800 leading-relaxed">
                    {error.suggestion}
                  </p>
                )}
                {error.showInstructionsAction && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={onViewInstructions}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-900 bg-white hover:bg-red-50 border border-red-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Download Instructions</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analyze Submit Row */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <p className="text-xs text-zinc-500">
            {!selectedFile && !jsonAcknowledged
              ? 'Select a ZIP archive and check "I have selected JSON format" to continue.'
              : !selectedFile
                ? 'Select your Instagram .zip archive above to enable analysis.'
                : !jsonAcknowledged
                  ? 'Check "I have selected JSON format" above to enable analysis.'
                  : 'Ready to analyze locally in your browser.'}
          </p>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze ZIP File</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
