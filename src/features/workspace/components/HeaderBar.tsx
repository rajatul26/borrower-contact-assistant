import { LogOut } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getConfig } from '@/config/brand';
import type { MockUser } from '@/lib/mock-api';
import { PrivacyBadge } from './PrivacyBadge';

type AppHeaderProps = {
  user: MockUser;
  onLogout: () => void;
  caseMeta?: { id: string; title: string } | null;
  onOpenDev: () => void;
};

export const HeaderBar: React.FC<AppHeaderProps> = ({ user, onLogout, caseMeta, onOpenDev }) => {
  const config = getConfig();

  return (
    <div className="h-14 border-b border-line bg-white/70 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold">{config.appName}</span>
        <Badge variant="secondary" className="hidden md:inline-flex">
          Skip Trace Bot
        </Badge>
        <PrivacyBadge />
        <Button size="sm" variant="ghost" onClick={onOpenDev} title="Open diagnostics">
          DEV
        </Button>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        {caseMeta && (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-slate-400">Case:</span> <b>{caseMeta.id}</b>
            <span className="text-slate-400">•</span>
            <span className="truncate max-w-[200px]">{caseMeta.title}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-slate-500">{user.role}</div>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
