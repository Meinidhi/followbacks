import { useCallback, useEffect, useState } from 'react';
import type {
  AnalysisResult,
  AnalyzerError,
  ResultCategory,
  SortOrder,
  ZipProcessProgress,
} from './types/analyzer';
import { analyzeInstagramZip } from './utils/ComparisonEngine';
import { revokeAllObjectUrls } from './utils/csvUtils';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DownloadInstructions } from './components/DownloadInstructions';
import { UploadSection } from './components/UploadSection';
import { ResultsDashboard } from './components/ResultsDashboard';
import { PrivacyNotice } from './components/PrivacyNotice';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

function isAnalyzerError(err: unknown): err is AnalyzerError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'title' in err &&
    'message' in err
  );
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonAcknowledged, setJsonAcknowledged] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ZipProcessProgress | null>(null);
  const [error, setError] = useState<AnalyzerError | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Dashboard interactive state
  const [activeCategory, setActiveCategory] = useState<ResultCategory>('non_followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Revoke any outstanding Blob object URLs on unmount
  useEffect(() => {
    return () => {
      revokeAllObjectUrls();
    };
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    setError(null);
    setProgress(null);
  }, []);

  const handleCategoryChange = useCallback((category: ResultCategory) => {
    setActiveCategory(category);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleSortOrderChange = useCallback((order: SortOrder) => {
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  const handleClearData = useCallback(() => {
    revokeAllObjectUrls();
    setSelectedFile(null);
    setJsonAcknowledged(false);
    setIsProcessing(false);
    setProgress(null);
    setError(null);
    setAnalysisResult(null);
    setActiveCategory('non_followers');
    setSearchQuery('');
    setSortOrder('asc');
    setCurrentPage(1);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || !jsonAcknowledged || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({
      stage: 'reading',
      percent: 10,
      message: 'Preparing local ZIP archive...',
    });

    try {
      const result = await analyzeInstagramZip(
        selectedFile,
        {
          fileName: selectedFile.name,
          fileSizeBytes: selectedFile.size,
        },
        (update) => {
          setProgress(update);
        }
      );

      setAnalysisResult(result);
      setActiveCategory('non_followers');
      setSearchQuery('');
      setSortOrder('asc');
      setCurrentPage(1);

      window.setTimeout(() => {
        scrollToSection('results');
      }, 120);
    } catch (err) {
      setAnalysisResult(null);
      if (isAnalyzerError(err)) {
        setError(err);
      } else {
        setError({
          code: 'FILE_READ_ERROR',
          title: 'Could not process ZIP archive',
          message:
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while reading your Instagram ZIP file.',
          suggestion:
            'Make sure your file is an unmodified Instagram JSON export ZIP and try again.',
          showInstructionsAction: true,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, jsonAcknowledged, isProcessing, scrollToSection]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-950">
      <Navbar
        hasResults={Boolean(analysisResult)}
        onNavigateToSection={scrollToSection}
        onAnalyzeCtaClick={() =>
          scrollToSection(analysisResult ? 'results' : 'analyze')
        }
      />

      <main className="flex-1">
        <LandingPage
          onAnalyzeClick={() => scrollToSection('analyze')}
          onInstructionsClick={() => scrollToSection('instructions')}
        />

        <DownloadInstructions />

        <UploadSection
          selectedFile={selectedFile}
          jsonAcknowledged={jsonAcknowledged}
          isProcessing={isProcessing}
          progress={progress}
          error={error}
          hasResults={Boolean(analysisResult)}
          onFileSelect={handleFileSelect}
          onValidationError={setError}
          onAcknowledgeChange={setJsonAcknowledged}
          onAnalyze={handleAnalyze}
          onClearData={handleClearData}
          onViewInstructions={() => scrollToSection('instructions')}
        />

        {analysisResult && (
          <ResultsDashboard
            result={analysisResult}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            currentPage={currentPage}
            onCategoryChange={handleCategoryChange}
            onSearchChange={handleSearchChange}
            onSortOrderChange={handleSortOrderChange}
            onPageChange={setCurrentPage}
            onClearData={handleClearData}
            onAnalyzeAnother={() => scrollToSection('analyze')}
          />
        )}

        <PrivacyNotice />

        <FAQ />
      </main>

      <Footer onNavigateToSection={scrollToSection} />
    </div>
  );
}
