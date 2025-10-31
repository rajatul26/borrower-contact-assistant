import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Calculator, ChevronLeft, ChevronRight, Globe, Menu, Phone, Wand2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MockAPI } from '@/lib/mock-api';
import { cn } from '@/lib/utils';
import { getConfig } from '@/config/brand';

import { CandidateDrawer } from './components/CandidateDrawer';
import { ChatBubble } from './components/ChatBubble';
import { EvidenceTabs } from './components/EvidenceTabs';
import { Sidebar } from './components/Sidebar';
import { UploadTray } from './components/UploadTray';
import type {
  CaseSummary,
  ChatMessage,
  FolderSummary,
  PhoneCandidate,
  UploadedDocument,
  WebLookupStatus,
} from './types';

type WorkspaceProps = {
  onOpenDev: () => void;
};

type WebResult = {
  title: string;
  domain: string;
  snippet: string;
};

export const Workspace: React.FC<WorkspaceProps> = ({ onOpenDev }) => {
  const config = getConfig();
  const welcomeMessage =
    "Welcome! Upload mortgage PDFs and I’ll extract phone candidates. If none are found, I can run a public lookup.";

  const [activeCase, setActiveCase] = useState<CaseSummary | null>(null);
  const [docs, setDocs] = useState<UploadedDocument[]>([]);
  const docsRef = useRef<UploadedDocument[]>([]);
  const docTimers = useRef<Map<string, number>>(new Map());
  const pendingExtractionDocsRef = useRef<Set<string>>(new Set());
  const autoExtractingRef = useRef(false);
  const autoExtractionQueuedRef = useRef(false);
  const [chat, setChat] = useState<ChatMessage[]>([{ who: 'bot', text: welcomeMessage }]);
  const [input, setInput] = useState('');
  const [candidates, setCandidates] = useState<PhoneCandidate[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'docs' | 'web'>('docs');
  const [webLookupStatus, setWebLookupStatus] = useState<WebLookupStatus>({ state: 'idle' });
  const [webTabPulse, setWebTabPulse] = useState(false);

  const releaseDocUrls = useCallback((list: UploadedDocument[]) => {
    list.forEach(doc => {
      if (doc?.url) {
        try {
          URL.revokeObjectURL(doc.url);
        } catch {
          // ignore revoke failures
        }
      }
    });
  }, []);

  const clearDocs = useCallback(() => {
    docTimers.current.forEach(timer => window.clearTimeout(timer));
    docTimers.current.clear();
    pendingExtractionDocsRef.current.clear();
    autoExtractionQueuedRef.current = false;
    autoExtractingRef.current = false;
    setDocs(prev => {
      releaseDocUrls(prev);
      return [];
    });
  }, [releaseDocUrls]);

  const handleEvidenceTabChange = useCallback((value: 'docs' | 'web') => {
    setActiveEvidenceTab(value);
    if (value === 'web') {
      setWebTabPulse(false);
    }
  }, []);

  const extractCandidatesForActiveCase = useCallback(
    async (context: 'auto' | 'manual' | 'chat') => {
      if (!activeCase) return;
      if (autoExtractingRef.current) {
        if (context === 'auto') {
          autoExtractionQueuedRef.current = true;
        }
        return;
      }
      autoExtractingRef.current = true;
      const introMessage =
        context === 'auto'
          ? 'Processing complete. Extracting phone candidates automatically…'
          : 'Extracting phone candidates from uploaded documents…';
      setChat(prev => [...prev, { who: 'bot', text: introMessage }]);
      try {
        const { candidates: found } = await MockAPI.extractCandidates({ caseId: activeCase.id });
        let newOnes: PhoneCandidate[] = [];
        setCandidates(prev => {
          const seen = new Set(prev.map(candidate => `${candidate.number}|${candidate.via}`));
          const addition = found.filter(candidate => {
            const key = `${candidate.number}|${candidate.via}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          newOnes = addition;
          if (!addition.length) return prev;
          return [...prev, ...addition];
        });
        if (newOnes.length > 0) {
          setDrawerOpen(true);
          setChat(prev => [
            ...prev,
            {
              who: 'bot',
              text:
                context === 'auto'
                  ? `Auto-extracted ${newOnes.length} candidate(s). Opened the list.`
                  : `Found ${newOnes.length} candidate(s). Opened the list.`,
            },
          ]);
        } else {
          setChat(prev => [...prev, { who: 'bot', text: 'No new candidates found in the latest extraction.' }]);
        }
      } catch {
        toast.error('Failed to extract phone candidates.');
      } finally {
        autoExtractingRef.current = false;
        if (autoExtractionQueuedRef.current) {
          autoExtractionQueuedRef.current = false;
          window.setTimeout(() => extractCandidatesForActiveCase('auto'), 0);
        }
      }
    },
    [activeCase]
  );

  const send = useCallback(async () => {
    if (!input.trim()) return;
    const message = input.trim();
    setChat(prev => [...prev, { who: 'user', text: message }]);
    setInput('');
    if (/lookup|web|search/i.test(message)) {
      setChat(prev => [...prev, { who: 'bot', text: 'Okay, running a public lookup…' }]);
      setWebLookupStatus({ state: 'loading', message: 'Browsing public records…' });
      if (activeEvidenceTab !== 'web') {
        setWebTabPulse(true);
      }
      try {
        const results = await MockAPI.webLookup({ name: activeCase?.title || 'Borrower', address: 'N/A' });
        setWebResults(results);
        setWebLookupStatus({ state: 'success', total: results.length });
        if (activeEvidenceTab !== 'web') {
          setWebTabPulse(true);
        }
        const openWebAction = (
          <Button
            key="open-web-tab"
            size="sm"
            variant="outline"
            onClick={() => {
              handleEvidenceTabChange('web');
            }}
          >
            View web results
          </Button>
        );
        setChat(prev => [
          ...prev,
          {
            who: 'bot',
            text: results.length === 0
              ? 'The lookup completed but no public entries were returned.'
              : `I found ${results.length} public entr${results.length === 1 ? 'y' : 'ies'}. You can add numbers as candidates from the Web tab.`,
            actions: [openWebAction],
          },
        ]);
      } catch {
        setWebLookupStatus({ state: 'error', message: 'Public lookup failed. Please try again.' });
        setChat(prev => [...prev, { who: 'bot', text: 'Public lookup failed. Please try again.' }]);
      }
    } else if (/extract|phone|candidate/i.test(message)) {
      if (!activeCase) {
        setChat(prev => [...prev, { who: 'bot', text: 'Please select or create a case first.' }]);
        return;
      }
      await extractCandidatesForActiveCase('chat');
    } else {
      setChat(prev => [...prev, { who: 'bot', text: "Try: 'extract phone', or 'run web lookup'." }]);
    }
  }, [activeCase, activeEvidenceTab, extractCandidatesForActiveCase, handleEvidenceTabChange, input]);

  const scheduleDocProcessing = useCallback(
    (doc: UploadedDocument, onComplete: () => void) => {
      if (!doc?.id || !doc?.steps) return;
      if (docTimers.current.has(doc.id)) {
        window.clearTimeout(docTimers.current.get(doc.id));
      }
      const durations = [2000, 2200, 2500, 2300, 2200];
      const runStep = (index: number) => {
        const steps = doc.steps || [];
        if (index >= steps.length) {
          setDocs(prev =>
            prev.map(item =>
              item.id === doc.id
                ? { ...item, status: 'completed', currentStep: 'Ready for extraction', stepIndex: steps.length }
                : item
            )
          );
          docTimers.current.delete(doc.id);
          onComplete?.();
          return;
        }
        const delay = durations[index] || 1000;
        setDocs(prev =>
          prev.map(item =>
            item.id === doc.id ? { ...item, status: 'processing', currentStep: steps[index], stepIndex: index } : item
          )
        );
        const timer = window.setTimeout(() => runStep(index + 1), delay);
        docTimers.current.set(doc.id, timer);
      };
      runStep(0);
    },
    []
  );

  const onFilesUploaded = useCallback(
    (uploaded: UploadedDocument[]) => {
      setDocs(prev => [...prev, ...uploaded]);
      uploaded.forEach(doc => {
        pendingExtractionDocsRef.current.add(doc.id);
        scheduleDocProcessing(doc, () => {
          pendingExtractionDocsRef.current.delete(doc.id);
          if (pendingExtractionDocsRef.current.size === 0 && activeCase) {
            extractCandidatesForActiveCase('auto');
          }
        });
      });
      if (!activeCase) {
        setChat(prev => [
          ...prev,
          { who: 'bot', text: `Uploaded ${uploaded.length} document(s). Select or create a case to extract phone numbers.` },
        ]);
        return;
      }
      setChat(prev => [
        ...prev,
        {
          who: 'bot',
          text: `Uploaded ${uploaded.length} document(s). I’ll extract phone candidates once processing completes.`,
        },
      ]);
    },
    [activeCase, extractCandidatesForActiveCase, scheduleDocProcessing]
  );

  const onSelectPrimary = useCallback((candidate: PhoneCandidate) => {
    setChat(prev => [
      ...prev,
      { who: 'bot', text: `Marked ${candidate.number} as primary. Case can be closed as Established.` },
    ]);
  }, []);

  const updateUrlState = useCallback(
    (nextState: { folder?: string | null; case?: string | null } = {}, { replace = false } = {}) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const folder = nextState.folder !== undefined ? nextState.folder : selectedFolderId;
      const caseId = nextState.case !== undefined ? nextState.case : activeCase?.id;
      const prevFolder = params.get('folder');
      const prevCase = params.get('case');
      const nextFolder = folder ?? null;
      const nextCase = caseId ?? null;
      if (!replace && prevFolder === nextFolder && prevCase === nextCase) return;
      if (nextFolder) {
        params.set('folder', nextFolder);
      } else {
        params.delete('folder');
      }
      if (nextCase) {
        params.set('case', nextCase);
      } else {
        params.delete('case');
      }
      const method: 'replaceState' | 'pushState' = replace ? 'replaceState' : 'pushState';
      const search = params.toString();
      const newUrl = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`;
      window.history[method]({}, '', newUrl);
    },
    [activeCase?.id, selectedFolderId]
  );

  const setCaseContext = useCallback(
    (
      caseData: CaseSummary | null,
      {
        syncUrl = true,
        replaceHistory = false,
        folderOverride,
        preserveData = false,
      }: { syncUrl?: boolean; replaceHistory?: boolean; folderOverride?: string | null; preserveData?: boolean } = {}
    ) => {
    if (!caseData) {
      setActiveCase(null);
      clearDocs();
      setCandidates([]);
      setWebResults([]);
      setWebLookupStatus({ state: 'idle' });
      setActiveEvidenceTab('docs');
      setWebTabPulse(false);
      setChat([{ who: 'bot', text: welcomeMessage }]);
      setDrawerOpen(false);
      if (syncUrl) {
        const folderValue = folderOverride !== undefined ? folderOverride : selectedFolderId;
        updateUrlState({ folder: folderValue, case: null }, { replace: replaceHistory });
        }
        return;
      }
      const folderForCase = folderOverride !== undefined ? folderOverride : caseData.folderId || selectedFolderId || null;
      setSelectedFolderId(folderForCase);
      setActiveCase(prev => (preserveData && prev ? { ...prev, ...caseData } : caseData));
    if (!preserveData) {
      clearDocs();
      setCandidates([]);
      setWebResults([]);
      setWebLookupStatus({ state: 'idle' });
      setActiveEvidenceTab('docs');
      setWebTabPulse(false);
      setChat([{ who: 'bot', text: `Opened case ${caseData.id}. Upload PDFs to begin.` }]);
      setDrawerOpen(false);
    }
      if (!preserveData) {
        setSidebarCollapsed(false);
      }
      if (syncUrl) {
        updateUrlState({ folder: folderForCase, case: caseData.id }, { replace: replaceHistory });
      }
    },
    [clearDocs, selectedFolderId, updateUrlState, welcomeMessage]
  );

  const handleSelectFolder = useCallback(
    (folder: FolderSummary | null) => {
      const id = folder?.id ?? null;
      if (id === selectedFolderId) return;
      setSelectedFolderId(id);
      setCaseContext(null, { syncUrl: false, folderOverride: id });
      updateUrlState({ folder: id, case: null });
    },
    [selectedFolderId, setCaseContext, updateUrlState]
  );

  const createCase = useCallback(
    (draft: CaseSummary) => {
      const folderId = draft.folderId ?? selectedFolderId ?? null;
      const created: CaseSummary = { ...draft, folderId, status: draft.status || 'Open' };
      setCaseContext(created);
    },
    [selectedFolderId, setCaseContext]
  );

  const addCandidateFromWeb = useCallback((candidate: PhoneCandidate) => {
    setCandidates(prev => {
      if (prev.some(existing => existing.number === candidate.number && existing.source?.type === 'web')) {
        return prev;
      }
      return [...prev, candidate];
    });
  }, []);

  const removeCandidateFromWeb = useCallback((number: string) => {
    setCandidates(prev => prev.filter(candidate => !(candidate.number === number && candidate.source?.type === 'web')));
  }, []);

  const handleCaseUpdated = useCallback(
    (updatedCase: CaseSummary | null, originalId: string) => {
      if (!originalId) return;
      if (!updatedCase) {
        if (activeCase?.id === originalId) {
          setCaseContext(null, { replaceHistory: true });
        }
        return;
      }
      if (activeCase?.id === originalId) {
        const folderForCase = updatedCase.folderId || selectedFolderId || null;
        setCaseContext(updatedCase, { folderOverride: folderForCase, preserveData: true, replaceHistory: true });
      }
    },
    [activeCase, selectedFolderId, setCaseContext]
  );

  useEffect(() => {
    const applyUrl = async () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const folderParam = params.get('folder');
      const caseParam = params.get('case');
      if (folderParam) {
        setSelectedFolderId(folderParam);
      } else {
        setSelectedFolderId(null);
      }
      if (caseParam) {
        const { items } = await MockAPI.listCases({ folderId: folderParam || null, q: caseParam, pageSize: 50 });
        const matching = items.find(item => item.id === caseParam) as CaseSummary | undefined;
        if (matching) {
          const resolvedFolder = matching.folderId || folderParam || null;
          setCaseContext(matching, { syncUrl: false, folderOverride: resolvedFolder });
          setSelectedFolderId(resolvedFolder);
        } else {
          setCaseContext(null, { syncUrl: false });
          updateUrlState({ case: null }, { replace: true });
        }
      } else {
        setCaseContext(null, { syncUrl: false });
      }
    };
    applyUrl();
    const onPop = () => applyUrl();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setCaseContext, updateUrlState]);

  useEffect(() => {
    docsRef.current = docs;
  }, [docs]);

  useEffect(() => {
    return () => {
      docTimers.current.forEach(timer => window.clearTimeout(timer));
      docTimers.current.clear();
      pendingExtractionDocsRef.current.clear();
      autoExtractionQueuedRef.current = false;
      autoExtractingRef.current = false;
      releaseDocUrls(docsRef.current);
    };
  }, [releaseDocUrls]);

  const webCandidateNumbers = useMemo(
    () => candidates.filter(candidate => candidate.source?.type === 'web').map(candidate => candidate.number),
    [candidates]
  );

  return (
    <div className="flex flex-1 min-h-0 max-h-full w-full overflow-hidden">
      <div
        className={cn(
          'relative hidden lg:block h-full transition-[width] duration-300 ease-in-out overflow-hidden',
          sidebarCollapsed ? 'w-0 min-w-0' : 'w-[360px] min-w-[280px]'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-300 ease-in-out',
            sidebarCollapsed ? '-translate-x-full pointer-events-none' : 'translate-x-0 pointer-events-auto'
          )}
        >
          <Sidebar
            onSelectCase={caseItem => {
              setCaseContext(caseItem, { folderOverride: caseItem.folderId || selectedFolderId || null });
            }}
            activeCaseId={activeCase?.id ?? null}
            onCreateCase={createCase}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
            onUpdateCase={handleCaseUpdated}
          />
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 py-3 border-b border-line bg-white/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden lg:block">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-500"
                      aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                      onClick={() => setSidebarCollapsed(prev => !prev)}
                    >
                      {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{sidebarCollapsed ? 'Show folders' : 'Hide folders'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-medium">{activeCase ? activeCase.title : 'No case selected'}</span>
            {activeCase && <Badge variant="secondary">{activeCase.id}</Badge>}
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-10 h-10 sm:h-9 sm:w-auto sm:px-3 flex items-center justify-center gap-2"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Candidates"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="hidden sm:inline">Candidates</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Phone candidates</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="btn-brand w-10 h-10 sm:h-9 sm:w-auto sm:px-4 flex items-center justify-center gap-2"
                    onClick={() => extractCandidatesForActiveCase('manual')}
                    aria-label="Extract"
                    disabled={!activeCase}
                  >
                    <Wand2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Extract</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Extract phone numbers</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-10 h-10 sm:h-9 sm:w-auto sm:px-3 flex items-center justify-center gap-2"
                    onClick={onOpenDev}
                    aria-label="Dev tests"
                  >
                    <Calculator className="h-4 w-4" />
                    <span className="hidden sm:inline">Dev tests</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Developer diagnostics</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <div className="flex-1 min-h-0 p-4 space-y-4 overflow-auto lg:overflow-hidden lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
          <div className="flex flex-col min-h-0 space-y-4">
            <div className="flex-1 rounded-2xl border border-line bg-slate-50 p-4 overflow-auto">
              <div className="space-y-3">
                {chat.map((message, index) => (
                  <ChatBubble key={`${message.who}-${index}-${message.text.slice(0, 8)}`} who={message.who} text={message.text} actions={message.actions} />
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                className="w-full"
                placeholder="Type a message… (e.g., ‘extract phone’, ‘run web lookup’)"
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    send();
                  }
                }}
              />
              <Button className="btn-brand w-full sm:w-auto" onClick={send}>
                Send
              </Button>
            </div>
          </div>
          <div className="flex flex-col min-h-0 space-y-4">
            <UploadTray onUploaded={onFilesUploaded} />
            <div className="flex-1 rounded-2xl border border-line bg-white p-4 overflow-auto">
              <EvidenceTabs
                docs={docs}
                web={webResults}
                onAddCandidate={addCandidateFromWeb}
                onRemoveCandidate={removeCandidateFromWeb}
                selectedNumbers={webCandidateNumbers}
                activeTab={activeEvidenceTab}
                onTabChange={handleEvidenceTabChange}
                webStatus={webLookupStatus}
                highlightWeb={webTabPulse}
              />
            </div>
          </div>
        </div>

        <footer className="border-t border-line py-2 px-4 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} {config.orgName}</span>
            <a className="underline" href="#">
              Privacy
            </a>
            <a className="underline" href="#">
              Acceptable Use
            </a>
            <a className="underline" href="#">
              Security overview
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" /> v0.1 Prototype
          </div>
        </footer>
      </div>

      <div className="lg:hidden">
        <Drawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <DrawerContent className="p-0">
            <DrawerHeader className="px-4 pt-4 pb-2">
              <DrawerTitle>Navigation</DrawerTitle>
              <DrawerDescription>Select folders &amp; cases to manage borrowers.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto max-h-[70vh]">
              <Sidebar
                onSelectCase={caseItem => {
                  setCaseContext(caseItem, { folderOverride: caseItem.folderId || selectedFolderId || null });
                }}
                activeCaseId={activeCase?.id ?? null}
                onCreateCase={createCase}
                selectedFolderId={selectedFolderId}
                onSelectFolder={handleSelectFolder}
                onUpdateCase={handleCaseUpdated}
                onCloseSidebar={() => setMobileSidebarOpen(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <CandidateDrawer open={drawerOpen} setOpen={setDrawerOpen} candidates={candidates} onSelectPrimary={onSelectPrimary} />
    </div>
  );
};

export default Workspace;
