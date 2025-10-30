import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Search,
  FolderPlus,
  Folder,
  ChevronLeft,
  ChevronRight,
  MoreVertical as MoreVerticalIcon,
  Pencil,
  Trash2,
  BookOpen,
  Plus as PlusIcon,
} from 'lucide-react';
import { MockAPI } from '@/lib/mock-api';
import { cn } from '@/lib/utils';

type FolderSummary = { id: string; name: string };
type CaseSummary = { id: string; title: string; status: string; folderId?: string | null };

type SidebarProps = {
  activeCaseId?: string | null;
  selectedFolderId?: string | null;
  onSelectCase: (caseItem: CaseSummary) => void;
  onCreateCase: () => void;
  onSelectFolder: (folder: FolderSummary) => void;
  onUpdateCase?: (updated: CaseSummary | null, originalId: string) => void;
  onCloseSidebar?: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeCaseId,
  selectedFolderId,
  onSelectCase,
  onCreateCase,
  onSelectFolder,
  onUpdateCase,
  onCloseSidebar,
}) => {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [folderPage, setFolderPage] = useState(1);
  const [folders, setFolders] = useState<{ items: FolderSummary[]; total: number }>({ items: [], total: 0 });
  const [cases, setCases] = useState<{ items: CaseSummary[]; total: number }>({ items: [], total: 0 });
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [draftCase, setDraftCase] = useState({ title: '', id: '' });

  const load = async () => {
    const folderRes = await MockAPI.listFolders({ q, page: folderPage, pageSize: 6 });
    setFolders(folderRes);
    const caseRes = await MockAPI.listCases({ folderId: selectedFolderId || null, q, page, pageSize: 12 });
    setCases(caseRes);
  };

  useEffect(() => {
    load();
  }, [q, page, folderPage, selectedFolderId]);

  useEffect(() => {
    setPage(1);
  }, [selectedFolderId]);

  useEffect(() => {
    setEditingCaseId(null);
    setDraftCase({ title: '', id: '' });
  }, [selectedFolderId]);

  const pages = Math.max(1, Math.ceil(cases.total / 12));
  const folderPages = Math.max(1, Math.ceil(folders.total / 6));

  const startEditCase = (caseItem: CaseSummary) => {
    setEditingCaseId(caseItem.id);
    setDraftCase({ title: caseItem.title || '', id: caseItem.id });
  };

  const cancelEditCase = () => {
    setEditingCaseId(null);
    setDraftCase({ title: '', id: '' });
  };

  const saveCaseEdit = () => {
    if (!editingCaseId) return;
    const original = cases.items.find(c => c.id === editingCaseId);
    if (!original) {
      cancelEditCase();
      return;
    }
    const nextId = (draftCase.id || '').trim();
    if (!nextId) {
      toast.error('Application number is required.');
      return;
    }
    const nextTitle = (draftCase.title || '').trim() || original.title || nextId;
    const duplicate = cases.items.some(c => c.id !== editingCaseId && c.id.toLowerCase() === nextId.toLowerCase());
    if (duplicate) {
      toast.error('Application number already exists.');
      return;
    }
    const updatedCase = { ...original, id: nextId, title: nextTitle };
    setCases(prev => ({
      ...prev,
      items: prev.items.map(c => (c.id === editingCaseId ? updatedCase : c)),
    }));
    toast.success('Case updated');
    onUpdateCase?.(updatedCase, editingCaseId);
    setEditingCaseId(null);
    setDraftCase({ title: '', id: '' });
  };

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCaseEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditCase();
    }
  };

  const deleteCase = (id: string) => {
    if (editingCaseId === id) {
      cancelEditCase();
    }
    setCases(prev => ({ ...prev, items: prev.items.filter(c => c.id !== id) }));
    toast.message('Case archived');
    onUpdateCase?.(null, id);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 p-3 bg-white/70 w-full max-w-full lg:max-w-[360px] overflow-hidden lg:border-r lg:border-line">
      <div className="flex items-center gap-2">
        <Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search folders & cases" className="h-9" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="text-slate-600" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Folder className="h-4 w-4" /> Folders
        </div>
        <Button size="sm" variant="ghost" onClick={() => toast.info('Create folder (mock)')}>
          <FolderPlus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Button size="icon" variant="ghost" disabled={folderPage <= 1} onClick={() => setFolderPage(p => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-slate-500">Page {folderPage} / {folderPages}</span>
        <Button size="icon" variant="ghost" disabled={folderPage >= folderPages} onClick={() => setFolderPage(p => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {folders.items.map(f => {
          const isActive = selectedFolderId === f.id;
          return (
            <Button
              key={f.id}
              variant="outline"
              className={cn('w-full !justify-start gap-2 text-left', isActive && 'btn-brand text-white border-transparent hover:brightness-105')}
              title={f.name}
              onClick={() => { onSelectFolder?.(f); setPage(1); }}
            >
              <Folder className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : '')} />
              <span className="truncate flex-1 min-w-0 text-left">{f.name}</span>
            </Button>
          );
        })}
      </div>

      <Separator className="my-2" />

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Cases</div>
        <Button size="sm" className="btn-brand" onClick={() => { onCreateCase(); onCloseSidebar?.(); }}>
          <PlusIcon className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      <div className="flex items-center justify-between mt-1">
        <Button size="icon" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-slate-500">Page {page} / {pages}</span>
        <Button size="icon" variant="ghost" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-1 pr-1">
          {cases.items.map(c => {
            const isActive = activeCaseId === c.id;
            const isEditing = editingCaseId === c.id;
            return (
              <div
                key={c.id}
                className={cn(
                  'group rounded-xl border p-2 hover:bg-slate-50 transition',
                  isActive ? 'bg-white shadow-sm' : 'border-line'
                )}
                style={isActive ? { borderColor: 'var(--brand-primary)' } : undefined}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={draftCase.title}
                      onChange={e => setDraftCase(prev => ({ ...prev, title: e.target.value }))}
                      onKeyDown={handleDraftKeyDown}
                      placeholder="Applicant name"
                      autoFocus
                    />
                    <Input
                      value={draftCase.id}
                      onChange={e => setDraftCase(prev => ({ ...prev, id: e.target.value }))}
                      onKeyDown={handleDraftKeyDown}
                      placeholder="Application #"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" className="btn-brand" onClick={saveCaseEdit}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditCase}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button className="text-left flex-1" onClick={() => { onSelectCase(c); onCloseSidebar?.(); }}>
                      <div className="text-sm font-medium truncate">{c.title || c.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{c.id}</span>
                        <Badge variant={c.status === 'Established' ? 'default' : 'secondary'} className="h-5">
                          {c.status}
                        </Badge>
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Case actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={e => { e.preventDefault(); startEditCase(c); }}>
                          <Pencil className="h-4 w-4" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onSelect={e => { e.preventDefault(); deleteCase(c.id); }}>
                          <Trash2 className="h-4 w-4" /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="text-[11px] text-slate-400">Showing {cases.items.length} of {cases.total} results</div>
    </div>
  );
};

export default Sidebar;
