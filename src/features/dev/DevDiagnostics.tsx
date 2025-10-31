import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MockAPI } from '@/lib/mock-api';
import { MoreVerticalIcon, PlusIcon } from '@/components/icons/LucideFallbacks';
import { DEFAULT_CONFIG, getConfig } from '@/config/brand';

type DevDiagnosticsProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

type DiagnosticResult = {
  name: string;
  pass: boolean;
};

export const DevDiagnostics: React.FC<DevDiagnosticsProps> = ({ open, setOpen }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const runTests = async () => {
      const collected: DiagnosticResult[] = [];
      collected.push({ name: 'Icon: MoreVerticalIcon available', pass: typeof MoreVerticalIcon === 'function' });
      collected.push({ name: 'Icon: PlusIcon available', pass: typeof PlusIcon === 'function' });

      const ok = await MockAPI.login({ username: 'agent@example.com', password: 'demo123' });
      const bad = await MockAPI.login({ username: 'x', password: 'y' });
      collected.push({ name: 'Login success path', pass: !!ok.ok });
      collected.push({ name: 'Login failure path', pass: !bad.ok });

      const sso = await MockAPI.ssoAzureAD();
      collected.push({ name: 'SSO success path', pass: !!sso.ok });

      const { items: folders, total: folderTotal } = await MockAPI.listFolders({});
      collected.push({ name: 'Folders returned', pass: Array.isArray(folders) && folders.length > 0 && folderTotal >= folders.length });

      const { candidates } = await MockAPI.extractCandidates({ caseId: 'C-TEST' });
      const hasFields = ['number', 'kind', 'via', 'confidence', 'source'].every(field => field in (candidates?.[0] ?? {}));
      collected.push({ name: 'Candidates exist', pass: Array.isArray(candidates) && candidates.length >= 1 });
      collected.push({ name: 'Candidate schema valid', pass: hasFields });

      const web = await MockAPI.webLookup({ name: 'Test', address: 'N/A' });
      const extracted = web.map(entry => entry.snippet.match(/\(\d{3}\) \d{3}-\d{4}/)?.[0] || 'NA');
      collected.push({ name: 'Web snippet regex works', pass: extracted.some(value => value !== 'NA') });

      const palette = getConfig()?.theme ?? DEFAULT_CONFIG.theme;
      collected.push({
        name: 'Brand palette loaded',
        pass: !!palette && Object.keys(palette).length >= 4,
      });

      if (!cancelled) {
        setResults(collected);
      }
    };

    runTests();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Developer diagnostics</DialogTitle>
          <DialogDescription>Quick runtime sanity checks for the prototype mock layer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {results.map(result => (
            <div key={result.name} className="flex items-center justify-between text-sm">
              <div>{result.name}</div>
              <Badge variant={result.pass ? 'default' : 'secondary'}>{result.pass ? 'PASS' : 'FAIL'}</Badge>
            </div>
          ))}
          {results.length === 0 && <div className="text-sm text-slate-500">Running tests…</div>}
        </div>
        <DialogFooter>
          <Button className="btn-brand" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DevDiagnostics;
