import { ShieldCheck, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getConfig } from '@/config/brand';

export const PrivacyBadge: React.FC = () => {
  const config = getConfig();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="h-4 w-4" /> PII Protected
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Privacy &amp; Security (Prototype)</DialogTitle>
          <DialogDescription>Transparency about how your data is handled in this UI-only prototype.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> <b>Data in transit:</b> {config.privacy.dataInTransit}
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> <b>Data at rest:</b> {config.privacy.dataAtRest}
          </div>
          <div>
            <b>Certifications (target):</b> {config.privacy.certifications.join(', ')}
          </div>
          <p>Note: This is a front-end prototype. OCR/LLM/Lookups are mocked. Integrate your services later.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="btn-brand text-white hover:bg-transparent hover:brightness-110">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyBadge;
