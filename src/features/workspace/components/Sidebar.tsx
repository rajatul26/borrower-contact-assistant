import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEventHandler } from 'react';
import { toast } from 'sonner';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Folder, FolderPlus, Pencil, Search, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MockAPI } from '@/lib/mock-api';
import { cn } from '@/lib/utils';
import type { CaseSummary, FolderSummary } from '@/features/workspace/types';
import { MoreVerticalIcon, PlusIcon } from '@/components/icons/LucideFallbacks';

type SidebarProps = {
  activeCaseId?: string | null;
  selectedFolderId: string | null;
  onSelectCase?: (caseItem: CaseSummary) => void;
  onCreateCase?: (caseItem: CaseSummary) => void;
  onSelectFolder?: (folder: FolderSummary | null) => void;
  onUpdateCase?: (caseItem: CaseSummary | null, originalId: string) => void;
  onCloseSidebar?: () => void;
};

type CaseListState = {
  items: CaseSummary[];
  total: number;
};

type FolderListState = {
  items: FolderSummary[];
  total: number;
};

const PAGE_SIZE_CASES = 12;
const PAGE_SIZE_FOLDERS = 6;

export const Sidebar: React.FC<SidebarProps> = ({
  activeCaseId,
  selectedFolderId,
  onSelectCase,
  onCreateCase,
  onSelectFolder,
  onUpdateCase,
  onCloseSidebar,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [casePage, setCasePage] = useState(1);
  const [folderPage, setFolderPage] = useState(1);
  const [folders, setFolders] = useState<FolderListState>({ items: [], total: 0 });
  const [allFolders, setAllFolders] = useState<FolderSummary[]>([]);
  const [createdFolders, setCreatedFolders] = useState<FolderSummary[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState('');
  const [folderPanelOpen, setFolderPanelOpen] = useState(false);
  const [cases, setCases] = useState<CaseListState>({ items: [], total: 0 });
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [draftCase, setDraftCase] = useState<Pick<CaseSummary, 'id' | 'title'>>({ id: '', title: '' });

  useEffect(() => {
    const load = async () => {
      const base = await MockAPI.listFolders({ q: '', page: 1, pageSize: 100 });
      const combined = [...createdFolders, ...base.items.filter(f => !createdFolders.some(cf => cf.id === f.id))];
      setAllFolders(combined);

      const filtered = combined.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const total = filtered.length;
      const nextFolderPage = Math.max(1, Math.ceil(total / PAGE_SIZE_FOLDERS));
      const currentPage = Math.min(folderPage, nextFolderPage);
      if (currentPage !== folderPage) {
        setFolderPage(currentPage);
      }
      const start = (currentPage - 1) * PAGE_SIZE_FOLDERS;
      setFolders({ items: filtered.slice(start, start + PAGE_SIZE_FOLDERS), total });

      const caseResponse = await MockAPI.listCases({
        folderId: selectedFolderId || null,
        q: searchTerm,
        page: casePage,
        pageSize: PAGE_SIZE_CASES,
      });
      setCases({ items: caseResponse.items as CaseSummary[], total: caseResponse.total });
    };
    load();
  }, [casePage, createdFolders, folderPage, searchTerm, selectedFolderId]);

  useEffect(() => {
    setCasePage(1);
  }, [selectedFolderId]);

  useEffect(() => {
    setEditingCaseId(null);
    setDraftCase({ id: '', title: '' });
    setCreatingFolder(false);
    setFolderDraft('');
    setFolderPanelOpen(false);
  }, [selectedFolderId]);

  const totalCasePages = Math.max(1, Math.ceil(cases.total / PAGE_SIZE_CASES));
  const totalFolderPages = Math.max(1, Math.ceil(folders.total / PAGE_SIZE_FOLDERS));

  const selectedFolderName = useMemo(() => {
    if (!selectedFolderId) return 'All folders';
    const match = allFolders.find(f => f.id === selectedFolderId) || createdFolders.find(f => f.id === selectedFolderId);
    return match?.name || 'Selected folder';
  }, [selectedFolderId, allFolders, createdFolders]);

  const startEditCase = (caseItem: CaseSummary) => {
    setEditingCaseId(caseItem.id);
    setDraftCase({ title: caseItem.title || '', id: caseItem.id });
  };

  const cancelEditCase = () => {
    setEditingCaseId(null);
    setDraftCase({ title: '', id: '' });
  };

  const cancelFolder = () => {
    setCreatingFolder(false);
    setFolderDraft('');
  };

  const saveFolder = () => {
    const name = folderDraft.trim();
    if (!name) {
      toast.error('Folder name is required.');
      return;
    }
    const newFolder: FolderSummary = { id: `cf-${Date.now()}`, name };
    setCreatedFolders(prev => [newFolder, ...prev.filter(f => f.id !== newFolder.id)]);
    setCreatingFolder(false);
    setFolderDraft('');
    setFolderPage(1);
    setCasePage(1);
    onSelectFolder?.(newFolder);
    onCloseSidebar?.();
    toast.success('Folder created');
  };

  const startCreateCase = () => {
    setCasePage(1);
    setEditingCaseId('NEW');
    setDraftCase({ title: '', id: '' });
    setCreatingFolder(false);
  };

  const saveCaseEdit = () => {
    if (!editingCaseId) return;
    const original = cases.items.find(c => c.id === editingCaseId);
    const nextId = (draftCase.id || '').trim();
    if (!nextId) {
      toast.error('Application number is required.');
      return;
    }
    const nextTitle = (draftCase.title || '').trim() || original?.title || nextId;
    const duplicate = cases.items.some(c => c.id !== editingCaseId && c.id.toLowerCase() === nextId.toLowerCase());
    if (duplicate) {
      toast.error('Application number already exists.');
      return;
    }

    if (editingCaseId === 'NEW') {
      const newCase: CaseSummary = {
        id: nextId,
        title: nextTitle,
        status: 'Open',
        folderId: selectedFolderId || null,
      };
      setCases(prev => ({
        total: prev.total + 1,
        items: [newCase, ...prev.items.filter(item => item.id !== newCase.id)],
      }));
      toast.success('Case created');
      onCreateCase?.(newCase);
      setEditingCaseId(null);
      setDraftCase({ title: '', id: '' });
      onCloseSidebar?.();
      return;
    }

    if (!original) {
      cancelEditCase();
      return;
    }

    const updatedCase: CaseSummary = { ...original, id: nextId, title: nextTitle };
    setCases(prev => ({
      ...prev,
      items: prev.items.map(c => (c.id === editingCaseId ? updatedCase : c)),
    }));
    toast.success('Case updated');
    onUpdateCase?.(updatedCase, editingCaseId);
    setEditingCaseId(null);
    setDraftCase({ title: '', id: '' });
  };

  const handleDraftChange = (field: 'id' | 'title', value: string) => {
    setDraftCase(prev => ({ ...prev, [field]: value }));
  };

  const handleDraftKeyDown: KeyboardEventHandler<HTMLInputElement> = event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveCaseEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
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
    <div className="h-full min-h-0 flex flex-col p-3 bg-white/70 w-full max-w-full lg:max-w-[360px] overflow-hidden lg:border-r lg:border-line">
      <div className="pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={searchTerm}
            onChange={event => {
              setSearchTerm(event.target.value);
              setCasePage(1);
              setFolderPage(1);
            }}
            placeholder="Search folders & cases"
            className="h-8 text-sm"
          />
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

        <div className="rounded-xl border border-line bg-white/80">
          <button type="button" className="w-full flex items-center justify-between px-3 py-2" onClick={() => setFolderPanelOpen(prev => !prev)}>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 truncate">
              <Folder className="h-4 w-4" />
              <span>{selectedFolderName}</span>
            </div>
            <ChevronDown className={cn('h-4 w-4 transition-transform', folderPanelOpen ? 'rotate-180' : 'rotate-0')} />
          </button>
          {folderPanelOpen && (
            <div className="border-t border-line px-3 py-2 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Folders</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" disabled={folderPage <= 1} onClick={() => setFolderPage(p => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={folderPage >= totalFolderPages} onClick={() => setFolderPage(p => Math.min(totalFolderPages, p + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 transition',
                    selectedFolderId === null ? 'bg-slate-100 text-slate-800' : 'text-slate-600'
                  )}
                  onClick={() => {
                    onSelectFolder?.(null);
                    setFolderPanelOpen(false);
                    setFolderPage(1);
                    setCasePage(1);
                  }}
                >
                  All folders
                </button>
                {folders.items.map(folder => {
                  const isActive = selectedFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 transition',
                        isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-600'
                      )}
                      onClick={() => {
                        onSelectFolder?.(folder);
                        setFolderPanelOpen(false);
                        setFolderPage(1);
                        setCasePage(1);
                      }}
                    >
                      {folder.name}
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-slate-400">
                Page {folderPage} / {totalFolderPages}
              </div>
              <div className="text-sm">
                {creatingFolder ? (
                  <div className="space-y-2">
                    <Input
                      value={folderDraft}
                      onChange={event => setFolderDraft(event.target.value)}
                      placeholder="Folder name"
                      autoFocus
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          saveFolder();
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          cancelFolder();
                        }
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" className="btn-brand" onClick={saveFolder}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelFolder}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setCreatingFolder(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New folder
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-2" />

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Cases
        </div>
        <Button size="sm" className="btn-brand" onClick={startCreateCase}>
          <PlusIcon className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
      <div className="flex items-center justify-between mt-1">
        <Button size="icon" variant="ghost" disabled={casePage <= 1} onClick={() => setCasePage(p => Math.max(1, p - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-slate-500">
          Page {casePage} / {totalCasePages}
        </span>
        <Button size="icon" variant="ghost" disabled={casePage >= totalCasePages} onClick={() => setCasePage(p => Math.min(totalCasePages, p + 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-1 pr-1">
          {editingCaseId === 'NEW' && (
            <div className="rounded-xl border border-dashed border-line p-3 bg-white">
              <div className="space-y-2">
                <Input value={draftCase.title} onChange={event => handleDraftChange('title', event.target.value)} onKeyDown={handleDraftKeyDown} placeholder="Applicant name" autoFocus />
                <Input value={draftCase.id} onChange={event => handleDraftChange('id', event.target.value)} onKeyDown={handleDraftKeyDown} placeholder="Application #" />
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" className="btn-brand" onClick={saveCaseEdit}>
                    Create
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEditCase}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {cases.items.map(caseItem => {
            const isActive = activeCaseId === caseItem.id;
            const isEditing = editingCaseId === caseItem.id;
            if (isEditing) {
              return (
                <div key={caseItem.id} className="rounded-xl border p-2 bg-white border-line">
                  <div className="space-y-2">
                    <Input value={draftCase.title} onChange={event => handleDraftChange('title', event.target.value)} onKeyDown={handleDraftKeyDown} placeholder="Applicant name" autoFocus />
                    <Input value={draftCase.id} onChange={event => handleDraftChange('id', event.target.value)} onKeyDown={handleDraftKeyDown} placeholder="Application #" />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        className="btn-brand"
                        onClick={event => {
                          event.preventDefault();
                          saveCaseEdit();
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={event => {
                          event.preventDefault();
                          cancelEditCase();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={caseItem.id}
                className={cn('group rounded-xl border p-2 hover:bg-slate-50 transition', isActive ? 'bg-white shadow-sm' : 'border-line')}
                style={isActive ? { borderColor: 'var(--brand-primary)' } : undefined}
              >
                <div className="flex items-center justify-between">
                  <button
                    className="text-left flex-1"
                    onClick={() => {
                      onSelectCase?.(caseItem);
                      onCloseSidebar?.();
                    }}
                  >
                    <div className="text-sm font-medium truncate">{caseItem.title || caseItem.id}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{caseItem.id}</span>
                      <Badge variant={caseItem.status === 'Established' ? 'default' : 'secondary'} className="h-5">
                        {caseItem.status}
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
                      <DropdownMenuItem
                        onSelect={event => {
                          event.preventDefault();
                          startEditCase(caseItem);
                        }}
                      >
                        <Pencil className="h-4 w-4" /> Edit details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onSelect={event => {
                          event.preventDefault();
                          deleteCase(caseItem.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="text-[11px] text-slate-400">
        Showing {cases.items.length} of {cases.total} results
      </div>
    </div>
  );
};

export default Sidebar;
