import { useMemo } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Download, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PhoneCandidate } from '@/features/workspace/types';

type CandidateDrawerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  candidates: PhoneCandidate[];
  onSelectPrimary: (candidate: PhoneCandidate) => void;
};

const formatSource = (candidate: PhoneCandidate) => {
  const source = candidate.source;
  if (!source) return '';
  if (source.type === 'doc') {
    const docId = source.docId ?? '';
    const page = source.page != null ? `#${source.page}` : '';
    return `doc:${docId}${page}`;
  }
  if (source.type === 'web') {
    return `web:${source.url ?? ''}`;
  }
  return source.type ?? '';
};

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({ open, setOpen, candidates, onSelectPrimary }) => {
  const deduped = useMemo(() => {
    const byNumber = new Map<string, PhoneCandidate>();
    candidates.forEach(candidate => {
      const existing = byNumber.get(candidate.number);
      if (!existing || (candidate.confidence ?? 0) > (existing.confidence ?? 0)) {
        byNumber.set(candidate.number, candidate);
      }
    });
    return Array.from(byNumber.values()).sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  }, [candidates]);

  const exportCsv = () => {
    if (deduped.length === 0) {
      toast.info('No candidates to export yet.');
      return;
    }
    const rows = [['number', 'kind', 'confidence', 'via', 'source']];
    deduped.forEach(candidate => {
      rows.push([
        candidate.number ?? '',
        candidate.kind ?? '',
        candidate.confidence != null ? (Math.round(candidate.confidence * 100) / 100).toString() : '',
        candidate.via ?? '',
        formatSource(candidate),
      ]);
    });
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `candidate-phones-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported candidate CSV');
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-2">
            <DrawerTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" /> Phone candidates
            </DrawerTitle>
            {deduped.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-600" onClick={exportCsv} aria-label="Export candidates as CSV">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export CSV (deduped by highest confidence)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <DrawerDescription>Select the best number to mark contact as established.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4">
          {deduped.length === 0 && <div className="text-sm text-slate-500">No candidates yet.</div>}
          {deduped.map(candidate => (
            <Card key={candidate.number} className="border-line">
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold tracking-wide">{candidate.number}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    {candidate.kind && <Badge variant="secondary">{candidate.kind}</Badge>}
                    {candidate.via && <span>via {candidate.via}</span>}
                    {candidate.confidence != null && <span>• Confidence {(candidate.confidence * 100) | 0}%</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="btn-brand"
                    onClick={() => {
                      onSelectPrimary(candidate);
                      toast.success('Primary set');
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Set primary
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CandidateDrawer;
