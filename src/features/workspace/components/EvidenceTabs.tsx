import { useMemo } from 'react';
import { toast } from 'sonner';
import { Download, Eye, FileText, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { PhoneCandidate, UploadedDocument, WebLookupStatus } from '@/features/workspace/types';

type EvidenceTabsProps = {
  docs: UploadedDocument[];
  web: WebResult[];
  onAddCandidate: (candidate: PhoneCandidate) => void;
  onRemoveCandidate?: (number: string) => void;
  selectedNumbers?: string[];
  activeTab: 'docs' | 'web';
  onTabChange: (value: 'docs' | 'web') => void;
  webStatus: WebLookupStatus;
  highlightWeb?: boolean;
};

type WebResult = {
  title: string;
  domain: string;
  snippet: string;
};

const STATUS_COLORS: Record<UploadedDocument['status'], string> = {
  pending: 'bg-slate-200 text-slate-700',
  processing: 'bg-amber-200 text-amber-800',
  completed: 'bg-emerald-200 text-emerald-800',
  error: 'bg-red-200 text-red-700',
};

const resolveSourceLabel = (domain: string) => {
  const host = domain.toLowerCase();
  if (host.includes('truepeople')) return 'TruePeopleSearch';
  if (host.includes('spokeo')) return 'Spokeo';
  if (host.includes('truthfinder')) return 'TruthFinder';
  if (host.includes('whitepages')) return 'Whitepages';
  return 'Web';
};

const getStatusBadgeClass = (status: UploadedDocument['status']) => STATUS_COLORS[status] ?? STATUS_COLORS.pending;

export const EvidenceTabs: React.FC<EvidenceTabsProps> = ({
  docs,
  web,
  onAddCandidate,
  onRemoveCandidate = () => {},
  selectedNumbers = [],
  activeTab,
  onTabChange,
  webStatus,
  highlightWeb = false,
}) => {
  const webEntries = useMemo(() => web ?? [], [web]);
  const webCount = webEntries.length;
  const webEmpty = webCount === 0;

  const renderWebStatus = () => {
    if (webStatus.state === 'loading') {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{webStatus.message ?? 'Browsing public records…'}</span>
        </div>
      );
    }
    if (webStatus.state === 'success') {
      return (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <Badge variant="outline" className="font-medium">
            {webStatus.total}
          </Badge>
          <span>{webStatus.total === 1 ? 'Found 1 public entry.' : `Found ${webStatus.total} public entries.`}</span>
        </div>
      );
    }
    if (webStatus.state === 'error') {
      return <div className="text-sm text-red-600">{webStatus.message ?? 'Web lookup failed. Try again.'}</div>;
    }
    return null;
  };

  return (
    <Tabs value={activeTab} onValueChange={value => onTabChange(value as 'docs' | 'web')} className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="docs">Documents</TabsTrigger>
        <TabsTrigger
          value="web"
          className={cn(
            'flex items-center justify-center gap-2 transition',
            highlightWeb && 'ring-2 ring-offset-2 ring-brand shadow-sm'
          )}
        >
          <span>Web</span>
          {webCount > 0 && (
            <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
              {webCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="docs" className="space-y-2">
        {docs.length === 0 && <div className="text-sm text-slate-500">No documents uploaded yet.</div>}
        {docs.map(doc => {
          const stepNumber = typeof doc.stepIndex === 'number' ? doc.stepIndex + 1 : 1;
          const stepLabel = doc.currentStep || 'Processing…';
          return (
            <Card key={doc.id} className="border-line">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" /> {doc.name}
                  {doc.pages > 0 && <Badge variant="secondary">{doc.pages} pages</Badge>}
                  <span className={cn('text-[11px] px-2 py-1 rounded-full capitalize', getStatusBadgeClass(doc.status))}>
                    {doc.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500">
                  {doc.status === 'completed' ? 'Preview & hit-highlighting are stubbed in prototype.' : `Step ${stepNumber}: ${stepLabel}`}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!doc.url || doc.status !== 'completed'}
                    onClick={() => {
                      if (doc?.url) {
                        window.open(doc.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!doc.url || doc.status !== 'completed'}
                    onClick={() => {
                      if (!doc?.url) return;
                      const link = document.createElement('a');
                      link.href = doc.url;
                      link.download = doc.name || 'document.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>
      <TabsContent value="web" className="space-y-2">
        {renderWebStatus()}
        {webEmpty && webStatus.state !== 'loading' && (
          <div className="text-sm text-slate-500">
            {webStatus.state === 'success'
              ? 'No public entries were returned for this borrower.'
              : 'No lookup yet. Ask the bot to run a public lookup.'}
          </div>
        )}
        {webEntries.map((entry, index) => {
          const phone = entry.snippet.match(/\(\d{3}\) \d{3}-\d{4}/)?.[0] || '+1 000 000 0000';
          const isAdded = selectedNumbers.includes(phone);
          const sourceLabel = resolveSourceLabel(entry.domain);
          return (
            <Card key={`${entry.domain}-${index}`} className="border-line">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">
                  {entry.title} <span className="text-xs text-slate-500">({entry.domain})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <div className="text-sm text-slate-600">{entry.snippet}</div>
                <Button
                  size="sm"
                  variant={isAdded ? 'ghost' : 'outline'}
                  onClick={() => {
                    if (isAdded) {
                      onRemoveCandidate(phone);
                      toast.message('Removed from candidates');
                    } else {
                      onAddCandidate({
                        number: phone,
                        kind: 'web',
                        via: sourceLabel,
                        confidence: 0.5,
                        source: { type: 'web', url: `https://${entry.domain}`, snippet: entry.snippet },
                      });
                      toast.success('Added as candidate');
                    }
                  }}
                >
                  {isAdded ? 'Remove' : 'Add'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>
    </Tabs>
  );
};

export default EvidenceTabs;
