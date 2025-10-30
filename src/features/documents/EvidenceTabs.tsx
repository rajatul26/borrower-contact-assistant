import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DocumentStatus = {
  id: string;
  name: string;
  pages: number;
  url?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  currentStep: string;
  stepIndex: number;
  steps: string[];
};

type WebResult = { title: string; domain: string; snippet: string };

type EvidenceTabsProps = {
  docs: DocumentStatus[];
  web: WebResult[];
  onAddCandidate: (candidate: { number: string; kind: string; via: string; confidence: number; source: any }) => void;
  onRemoveCandidate?: (number: string) => void;
  selectedNumbers?: string[];
};

const statusColors: Record<string, string> = {
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

export const EvidenceTabs: React.FC<EvidenceTabsProps> = ({
  docs = [],
  web = [],
  onAddCandidate,
  onRemoveCandidate = () => {},
  selectedNumbers = [],
}) => (
  <Tabs defaultValue="docs" className="w-full">
    <TabsList className="grid grid-cols-2 w-full">
      <TabsTrigger value="docs">Documents</TabsTrigger>
      <TabsTrigger value="web">Web</TabsTrigger>
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
                <span className={cn('text-[11px] px-2 py-1 rounded-full capitalize', statusColors[doc.status] || statusColors.pending)}>
                  {doc.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {doc.status === 'completed'
                  ? 'Preview & hit-highlighting are stubbed in prototype.'
                  : `Step ${stepNumber}: ${stepLabel}`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!doc.url || doc.status !== 'completed'}
                  onClick={() => {
                    if (doc.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!doc.url || doc.status !== 'completed'}
                  onClick={() => {
                    if (!doc.url) return;
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
      {web.length === 0 && <div className="text-sm text-slate-500">No lookup yet. Ask bot to run a public lookup.</div>}
      {web.map((result, idx) => {
        const phone = result.snippet.match(/\(\d{3}\) \d{3}-\d{4}/)?.[0] || '+1 000 000 0000';
        const isAdded = selectedNumbers.includes(phone);
        const sourceLabel = resolveSourceLabel(result.domain);
        return (
          <Card key={`${result.domain}-${idx}`} className="border-line">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                {result.title} <span className="text-xs text-slate-500">({result.domain})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <div className="text-sm text-slate-600">{result.snippet}</div>
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
                      source: { type: 'web', url: `https://${result.domain}`, snippet: result.snippet },
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

export default EvidenceTabs;
