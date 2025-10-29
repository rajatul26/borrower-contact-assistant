import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileText,
  UploadCloud,
  Loader2,
  ShieldCheck,
  Lock,
  Search,
  Plus as LucidePlus,
  MoreVertical as LucideMoreVertical,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  KeyRound,
  Phone,
  Download,
  Globe,
  Wand2,
  CheckCircle2,
  Pencil,
  Trash2,
  FolderPlus,
  Folder,
  Users,
  BookOpen,
  Eye,
} from "lucide-react";

/************************************
 * CONFIG (Mocked white-label theme)
 ************************************/
const DEFAULT_CONFIG = {
  appName: "Borrower Contact Assistant",
  orgName: "RevEL Lending",
  theme: {
    // Brand palette from request
    primary: "#2B539A", // Medium Blue (primary accents/buttons)
    accent: "#3296C8",  // Light Blue (accent/success)
    text: "#111827",
    secondaryText: "#6B7280",
    card: "#F9FAFB",
    line: "#E5E7EB",
    // Gradient stops
    bgFarLeft: "#2F294F",   // Dark Purple-Blue
    bgDarkNavy: "#1A324A",  // Dark Navy
    bgMediumBlue: "#2B539A",// Medium Blue
    bgLightBlue: "#3296C8", // Light Blue
  },
  privacy: {
    dataAtRest: "AES-256",
    dataInTransit: "TLS 1.3",
    certifications: ["SOC 2 (WIP for proto)", "ISO 27001 (future)"]
  },
};

let CONFIG = DEFAULT_CONFIG; // will be optionally overridden by /config.json

// Optional: attempt to load /config.json for white‑label theming at runtime (non-blocking)
(async () => {
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (res.ok) {
      const external = await res.json();
      CONFIG = { ...DEFAULT_CONFIG, ...external, theme: { ...DEFAULT_CONFIG.theme, ...(external.theme||{}) } };
    }
  } catch (_) {
    // ignore – fallback to default config
  }
})();

// Apply theme to CSS vars so brands can override via config file later
const ThemeVars = () => (
  <style>{`
    :root{
      --brand-primary:${CONFIG.theme.primary};
      --brand-accent:${CONFIG.theme.accent};
      --brand-text:${CONFIG.theme.text};
      --brand-text-2:${CONFIG.theme.secondaryText};
      --brand-card:${CONFIG.theme.card};
      --brand-line:${CONFIG.theme.line};
      --bg-far-left:${CONFIG.theme.bgFarLeft};
      --bg-dark-navy:${CONFIG.theme.bgDarkNavy};
      --bg-medium-blue:${CONFIG.theme.bgMediumBlue};
      --bg-light-blue:${CONFIG.theme.bgLightBlue};
    }
    .brand-primary{ background:var(--brand-primary);} 
    .text-brand{ color:var(--brand-primary);} 
    .ring-brand{ --tw-ring-color: var(--brand-primary);} 
    .border-line{ border-color: var(--brand-line);} 
    /* App gradient background helper */
    .app-gradient-bg{
      background: linear-gradient(90deg, var(--bg-far-left) 0%, var(--bg-dark-navy) 25%, var(--bg-medium-blue) 60%, var(--bg-light-blue) 100%);
    }
    /* Brand gradient button */
    .btn-brand{
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));
      color: white;
      border: none;
    }
    .btn-brand:hover{ filter: brightness(1.05);} 
    .btn-brand:disabled{ opacity: .75; }
    .btn-brand:focus{ outline: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-accent) 40%, transparent);} 
  `}</style>
);

/************************************
 * ICON FALLBACKS (fix for sandbox/CDN issues)
 ************************************/
const PlusIcon = (props) => {
  if (typeof LucidePlus === "function") return <LucidePlus {...props} />;
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
};

const MoreVerticalIcon = (props) => {
  if (typeof LucideMoreVertical === "function") return <LucideMoreVertical {...props} />;
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="5" r="1"></circle>
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="12" cy="19" r="1"></circle>
    </svg>
  );
};

/************************************
 * MOCK API LAYER (front-end only)
 ************************************/
const mockDelay = (ms=700) => new Promise(res=>setTimeout(res,ms));

const MockAPI = {
  async login({ username, password }) {
    await mockDelay();
    if (username === "agent@example.com" && password === "demo123") {
      return { ok: true, user: { id: "u1", name: "Case Agent", role: "Agent" } };
    }
    return { ok: false, error: "Invalid credentials" };
  },
  async ssoAzureAD() {
    await mockDelay(900);
    return { ok: true, user: { id: "u-azure", name: "SSO Agent", role: "Agent (SSO)" } };
  },
  async listFolders({ q = "", page = 1, pageSize = 6 }) {
    await mockDelay(350);
    const all = ["North Region", "West Region", "VIP", "Delinquent Q3", "Refinance", "Escalations", "Developers", "Training", "Audit"]
      .map((name, idx) => ({ id: `f${idx+1}`, name }));
    const filtered = all.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
    const start = (page-1)*pageSize; const end = start + pageSize;
    return { items: filtered.slice(start, end), total: filtered.length };
  },
  async listCases({ folderId = null, q = "", page = 1, pageSize = 10 }) {
    await mockDelay(450);
    // Mock 40 cases
    const all = Array.from({ length: 40 }).map((_, i) => ({
      id: `C-${202500 + i}`,
      title: i % 2 ? `App: John Doe ${i}` : `App: Priya Shah ${i}`,
      folderId: i % 3 === 0 ? "f1" : i % 3 === 1 ? "f2" : "f3",
      status: i % 4 === 0 ? "Established" : "Open",
      createdAt: new Date(Date.now() - i * 36e5).toISOString(),
    }));
    const filtered = all.filter(c => (!folderId || c.folderId === folderId) && (c.id.toLowerCase().includes(q.toLowerCase()) || c.title.toLowerCase().includes(q.toLowerCase())));
    const start = (page-1)*pageSize; const end = start + pageSize;
    return { items: filtered.slice(start, end), total: filtered.length };
  },
  async uploadDocs(files) {
    await mockDelay(800);
    return files.map((f, i) => ({ id: `d${Date.now()}-${i}`, name: f.name, pages: Math.ceil(Math.random()*8)+1, scanned: true }));
  },
  async extractCandidates({ caseId }) {
    await mockDelay(1200);
    // produce a few phone candidates
    const phones = [
      { number: "+1 (415) 555-0134", kind: "mobile", via: "regex", confidence: 0.82, source: { type: "doc", docId: "d1", page: 2, snippet: "Borrower: John Doe, Phone: (415) 555-0134" } },
      { number: "+1 650 555 7788", kind: "mobile", via: "llm", confidence: 0.73, source: { type: "doc", docId: "d2", page: 1, snippet: "Emergency contact…" } },
      { number: "+1 408 555 9900", kind: "work", via: "web", confidence: 0.59, source: { type: "web", url: "example.com/profile", snippet: "Linked profile lists 408-555-9900" } },
    ];
    return { candidates: phones };
  },
  async webLookup({ name, address }) {
    await mockDelay(900);
    return [
      { title: `${name} – TruePeopleSearch`, domain: "truepeoplesearch.com", snippet: "TruePeople listing shows primary: (650) 555-7788 near last known address." },
      { title: `${name} on Spokeo`, domain: "spokeo.com", snippet: "Spokeo profile indicates mobile (415) 555-0134 and relatives in San Mateo." },
      { title: `${name} – TruthFinder Report`, domain: "truthfinder.com", snippet: "TruthFinder background report suggests potential contact (408) 555-9900." },
      { title: `${name} – Whitepages Listing`, domain: "whitepages.com", snippet: "Whitepages reverse lookup: landline (628) 555-4422 registered to household." },
      { title: `${name} – Public Records`, domain: "publicrecords.example", snippet: "Possible contact: (650) 555-7788" },
      { title: `${name} on ProNet`, domain: "pronet.example", snippet: "Mobile listed: 415-555-0134" },
      { title: `${name} – Alumni`, domain: "alumni.example", snippet: "Phone: 408-555-9900" },
    ];
  },
};

/************************************
 * UTIL
 ************************************/
const cn = (...a) => a.filter(Boolean).join(" ");

/************************************
 * AUTH SCREENS
 ************************************/
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState("agent@example.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const doLogin = async () => {
    setLoading(true);
    const res = await MockAPI.login({ username, password });
    setLoading(false);
    if (res.ok) { onLogin(res.user); } else { toast.error(res.error || "Login failed"); }
  };

  const doSSO = async () => {
    setSsoLoading(true);
    const res = await MockAPI.ssoAzureAD();
    setSsoLoading(false);
    if (res.ok) { onLogin(res.user); } else { toast.error("SSO failed"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50">
      <ThemeVars />
      <Card className="w-full max-w-md shadow-xl border border-line">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-brand" /> {CONFIG.orgName}
          </CardTitle>
          <p className="text-sm text-slate-500">{CONFIG.appName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="agent@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button className="w-full btn-brand" onClick={doLogin} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <KeyRound className="h-4 w-4 mr-2"/>}
            Sign in
          </Button>
          <div className="flex items-center gap-2"><Separator className="flex-1" /><span className="text-xs text-slate-400">or</span><Separator className="flex-1"/></div>
          <Button variant="outline" className="w-full" onClick={doSSO} disabled={ssoLoading}>
            {ssoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Users className="h-4 w-4 mr-2"/>}
            Continue with Azure AD
          </Button>
          <p className="text-xs text-slate-500 text-center">Mock-only for prototype. Wire to IdP later.</p>
        </CardContent>
      </Card>
    </div>
  );
};

/************************************
 * LEFT NAV: Folders & Cases (search + pagination + rename)
 ************************************/
const Sidebar = ({ onSelectCase, activeCaseId, onCreateCase, selectedFolderId, onSelectFolder, onUpdateCase }) => {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [folderPage, setFolderPage] = useState(1);
  const [folders, setFolders] = useState({ items: [], total: 0 });
  const [cases, setCases] = useState({ items: [], total: 0 });

  const load = async () => {
    const f = await MockAPI.listFolders({ q, page: folderPage, pageSize: 6 });
    setFolders(f);
    const c = await MockAPI.listCases({ folderId: selectedFolderId || null, q, page, pageSize: 12 });
    setCases(c);
  };
  useEffect(() => { load(); }, [q, page, folderPage, selectedFolderId]);
  useEffect(() => { setPage(1); }, [selectedFolderId]);

  const pages = Math.max(1, Math.ceil(cases.total/12));
  const folderPages = Math.max(1, Math.ceil(folders.total/6));
  const [editingCaseId, setEditingCaseId] = useState(null);
  const [draftCase, setDraftCase] = useState({ title: "", id: "" });
  useEffect(() => {
    setEditingCaseId(null);
    setDraftCase({ title: "", id: "" });
  }, [selectedFolderId]);

  const startEditCase = (caseItem) => {
    setEditingCaseId(caseItem.id);
    setDraftCase({ title: caseItem.title || "", id: caseItem.id });
  };

  const cancelEditCase = () => {
    setEditingCaseId(null);
    setDraftCase({ title: "", id: "" });
  };

  const saveCaseEdit = () => {
    if (!editingCaseId) return;
    const original = cases.items.find(c => c.id === editingCaseId);
    if (!original) { cancelEditCase(); return; }
    const nextId = (draftCase.id || "").trim();
    if (!nextId) { toast.error("Application number is required."); return; }
    const nextTitle = (draftCase.title || "").trim() || original.title || nextId;
    const duplicate = cases.items.some(c => c.id !== editingCaseId && c.id.toLowerCase() === nextId.toLowerCase());
    if (duplicate) { toast.error("Application number already exists."); return; }
    const updatedCase = { ...original, id: nextId, title: nextTitle };
    setCases(prev => ({
      ...prev,
      items: prev.items.map(c => c.id === editingCaseId ? updatedCase : c)
    }));
    toast.success("Case updated");
    onUpdateCase?.(updatedCase, editingCaseId);
    setEditingCaseId(null);
    setDraftCase({ title: "", id: "" });
  };

  const handleDraftChange = (field, value) => {
    setDraftCase(prev => ({ ...prev, [field]: value }));
  };

  const handleDraftKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCaseEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditCase();
    }
  };

  const deleteCase = (id) => {
    if (editingCaseId === id) {
      cancelEditCase();
    }
    setCases(prev => ({ ...prev, items: prev.items.filter(c => c.id !== id) }));
    toast.message("Case archived");
    onUpdateCase?.(null, id);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 p-3 border-r border-line bg-white/70 w-full max-w-[360px] overflow-hidden">
      <div className="flex items-center gap-2">
        <Input value={q} onChange={e=>{setQ(e.target.value); setPage(1);}} placeholder="Search folders & cases" className="h-9" />
        <TooltipProvider><Tooltip><TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="text-slate-600" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </TooltipTrigger><TooltipContent>Search</TooltipContent></Tooltip></TooltipProvider>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Folder className="h-4 w-4"/> Folders
        </div>
        <Button size="sm" variant="ghost" onClick={()=>toast.info("Create folder (mock)")}> <FolderPlus className="h-4 w-4 mr-1"/> New</Button>
      </div>
      <div className="flex items-center justify-between">
        <Button size="icon" variant="ghost" disabled={folderPage<=1} onClick={()=>setFolderPage(p=>p-1)}><ChevronLeft className="h-4 w-4"/></Button>
        <span className="text-xs text-slate-500">Page {folderPage} / {folderPages}</span>
        <Button size="icon" variant="ghost" disabled={folderPage>=folderPages} onClick={()=>setFolderPage(p=>p+1)}><ChevronRight className="h-4 w-4"/></Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {folders.items.map(f => {
          const isActive = selectedFolderId === f.id;
          return (
            <Button
              key={f.id}
              variant="outline"
              className={cn(
                "w-full !justify-start gap-2 text-left",
                isActive && "btn-brand text-white border-transparent hover:brightness-105"
              )}
              title={f.name}
              onClick={()=>{onSelectFolder?.(f); setPage(1);}}
            >
              <Folder className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "")}/>
              <span className="truncate flex-1 min-w-0 text-left">{f.name}</span>
            </Button>
          );
        })}
      </div>

      <Separator className="my-2"/>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 flex items-center gap-2"><BookOpen className="h-4 w-4"/> Cases</div>
        <Button size="sm" className="btn-brand" onClick={onCreateCase}><PlusIcon className="h-4 w-4 mr-1"/> New</Button>
      </div>
      <div className="flex items-center justify-between mt-1">
        <Button size="icon" variant="ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="h-4 w-4"/></Button>
        <span className="text-xs text-slate-500">Page {page} / {pages}</span>
        <Button size="icon" variant="ghost" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}><ChevronRight className="h-4 w-4"/></Button>
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
                  "group rounded-xl border p-2 hover:bg-slate-50 transition",
                  isActive ? "bg-white shadow-sm" : "border-line"
                )}
                style={isActive ? { borderColor: "var(--brand-primary)" } : undefined}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={draftCase.title}
                      onChange={e=>handleDraftChange("title", e.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      placeholder="Applicant name"
                      autoFocus
                    />
                    <Input
                      value={draftCase.id}
                      onChange={e=>handleDraftChange("id", e.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      placeholder="Application #"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" className="btn-brand" onClick={(e)=>{ e.preventDefault(); saveCaseEdit(); }}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={(e)=>{ e.preventDefault(); cancelEditCase(); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button className="text-left flex-1" onClick={()=>onSelectCase(c)}>
                      <div className="text-sm font-medium truncate">{c.title || c.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{c.id}</span>
                        <Badge variant={c.status==="Established"?"default":"secondary"} className="h-5">{c.status}</Badge>
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100"><MoreVerticalIcon className="h-4 w-4"/></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Case actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={(e)=>{ e.preventDefault(); startEditCase(c); }}>
                          <Pencil className="h-4 w-4"/> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onSelect={(e)=>{ e.preventDefault(); deleteCase(c.id); }}>
                          <Trash2 className="h-4 w-4"/> Archive
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

/************************************
 * MAIN WORKSPACE
 ************************************/
const UploadTray = ({ onUploaded }) => {
  const [queue, setQueue] = useState([]);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const arr = Array.from(files);
    setQueue(arr.map((f, i) => ({ id: i, name: f.name, progress: 0 })));
    const fileMeta = arr.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));

    // simulate progess
    for (let i=0;i<arr.length;i++) {
      for (let p=0; p<=100; p+=20) {
        await mockDelay(120);
        setQueue(prev => prev.map(it => it.id===i ? { ...it, progress: p } : it));
      }
    }

    try {
      const uploaded = await MockAPI.uploadDocs(arr);
      const enriched = uploaded.map((doc, idx) => {
        const meta = fileMeta[idx] || {};
        return {
          ...doc,
          name: doc.name || meta.file?.name || `Document ${idx + 1}`,
          file: meta.file || null,
          url: meta.url || null,
        };
      });
      onUploaded(enriched);
      toast.success(`${uploaded.length} document(s) uploaded`);
    } catch (err) {
      fileMeta.forEach(meta => {
        if (meta?.url) {
          try { URL.revokeObjectURL(meta.url); } catch (_) { /* ignore */ }
        }
      });
      toast.error("Upload failed. Please try again.");
    } finally {
      setQueue([]);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-line p-6 text-center bg-white">
      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="h-8 w-8 text-brand"/>
        <div className="text-sm text-slate-600">Drag & drop mortgage PDFs here, or</div>
        <Button variant="outline" onClick={()=>inputRef.current?.click()}>Browse files</Button>
        <input ref={inputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e)=>{ if(e.target.files?.length) handleFiles(e.target.files); }}/>
      </div>
      {queue.length>0 && (
        <div className="mt-4 text-left space-y-3">
          {queue.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <FileText className="h-4 w-4"/>
              <div className="flex-1">
                <div className="text-sm">{item.name}</div>
                <Progress value={item.progress} className="h-2"/>
              </div>
              <div className="text-xs text-slate-500 w-12 text-right">{item.progress}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ChatBubble = ({ who = "bot", text, actions }) => (
  <div className={cn("flex", who === "user" ? "justify-end" : "justify-start")}> 
    <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm", who === "user" ? "bg-slate-900 text-white" : "bg-white border border-line")}> 
      <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
      {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
    </div>
  </div>
);

const EvidenceTabs = ({ docs=[], web=[], onAddCandidate, onRemoveCandidate = () => {}, selectedNumbers=[] }) => {
  const resolveSourceLabel = (domain) => {
    const host = (domain || "").toLowerCase();
    if (host.includes("truepeople")) return "TruePeopleSearch";
    if (host.includes("spokeo")) return "Spokeo";
    if (host.includes("truthfinder")) return "TruthFinder";
    if (host.includes("whitepages")) return "Whitepages";
    return "Web";
  };

  return (
    <Tabs defaultValue="docs" className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="docs">Documents</TabsTrigger>
        <TabsTrigger value="web">Web</TabsTrigger>
      </TabsList>
      <TabsContent value="docs" className="space-y-2">
        {docs.length===0 && <div className="text-sm text-slate-500">No documents uploaded yet.</div>}
        {docs.map(d => (
          <Card key={d.id} className="border-line">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/> {d.name} <Badge variant="secondary">{d.pages} pages</Badge> <Badge>Scanned</Badge></CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">Preview & hit-highlighting are stubbed in prototype.</div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!d.url}
                  onClick={()=>{ if (d?.url) { window.open(d.url, "_blank", "noopener,noreferrer"); } }}
                >
                  <Eye className="h-4 w-4 mr-1"/> Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!d.url}
                  onClick={()=>{
                    if (!d?.url) return;
                    const link = document.createElement("a");
                    link.href = d.url;
                    link.download = d.name || "document.pdf";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="h-4 w-4 mr-1"/> Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
      <TabsContent value="web" className="space-y-2">
        {web.length===0 && <div className="text-sm text-slate-500">No lookup yet. Ask bot to run a public lookup.</div>}
        {web.map((w, i) => {
          const phone = w.snippet.match(/\(\d{3}\) \d{3}-\d{4}/)?.[0] || "+1 000 000 0000";
          const isAdded = selectedNumbers.includes(phone);
          const sourceLabel = resolveSourceLabel(w.domain);
          return (
            <Card key={i} className="border-line">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">{w.title} <span className="text-xs text-slate-500">({w.domain})</span></CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <div className="text-sm text-slate-600">{w.snippet}</div>
                <Button
                  size="sm"
                  variant={isAdded ? "ghost" : "outline"}
                  onClick={()=>{
                    if (isAdded) {
                      onRemoveCandidate(phone);
                      toast.message("Removed from candidates");
                    } else {
                      onAddCandidate({ number: phone, kind: "web", via: sourceLabel, confidence: 0.5, source: { type: "web", url: `https://${w.domain}`, snippet: w.snippet } });
                      toast.success("Added as candidate");
                    }
                  }}
                >
                  {isAdded ? "Remove" : "Add"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>
    </Tabs>
  );
};

const CandidateDrawer = ({ open, setOpen, candidates, onSelectPrimary }) => {
  const deduped = useMemo(() => {
    const byNumber = new Map();
    for (const candidate of candidates) {
      const existing = byNumber.get(candidate.number);
      if (!existing || candidate.confidence > existing.confidence) {
        byNumber.set(candidate.number, candidate);
      }
    }
    return Array.from(byNumber.values()).sort((a, b) => b.confidence - a.confidence);
  }, [candidates]);

  const exportCsv = () => {
    if (!deduped.length) {
      toast.info("No candidates to export yet.");
      return;
    }
    const rows = [
      ["number", "kind", "confidence", "via", "source"]
    ];
    deduped.forEach(({ number, kind, confidence, via, source }) => {
      const sourceLabel = source?.type === "doc"
        ? `doc:${source.docId}#${source.page}`
        : source?.type === "web"
        ? `web:${source.url || ""}`
        : source?.type || "";
      rows.push([
        number || "",
        kind || "",
        confidence != null ? (Math.round(confidence * 100) / 100).toString() : "",
        via || "",
        sourceLabel
      ]);
    });
    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `candidate-phones-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Exported candidate CSV");
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-2">
            <DrawerTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5"/> Phone candidates
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
          {deduped.length===0 && <div className="text-sm text-slate-500">No candidates yet.</div>}
          {deduped.map((c, idx) => (
            <Card key={idx} className="border-line">
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold tracking-wide">{c.number}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Badge variant="secondary">{c.kind}</Badge>
                    <span>via {c.via}</span>
                    <span>• Confidence {(c.confidence*100|0)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="btn-brand" onClick={()=>{ onSelectPrimary(c); toast.success("Primary set"); }}><CheckCircle2 className="h-4 w-4 mr-1"/> Set primary</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const PrivacyBadge = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="gap-2"><ShieldCheck className="h-4 w-4"/> PII Protected</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Privacy & Security (Prototype)</DialogTitle>
        <DialogDescription>Transparency about how your data is handled in this UI-only prototype.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-center gap-2"><Lock className="h-4 w-4"/> <b>Data in transit:</b> {CONFIG.privacy.dataInTransit}</div>
        <div className="flex items-center gap-2"><Lock className="h-4 w-4"/> <b>Data at rest:</b> {CONFIG.privacy.dataAtRest}</div>
        <div><b>Certifications (target):</b> {CONFIG.privacy.certifications.join(", ")}</div>
        <p>Note: This is a front-end prototype. OCR/LLM/Lookups are mocked. Integrate your services later.</p>
      </div>
      <DialogFooter>
        <Button>Okay</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const HeaderBar = ({ user, onLogout, caseMeta, onOpenDev }) => (
  <div className="h-14 border-b border-line bg-white/70 px-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-lg font-semibold">{CONFIG.appName}</span>
      <Badge variant="secondary" className="hidden md:inline-flex">White‑label</Badge>
      <PrivacyBadge />
      <Button size="sm" variant="ghost" onClick={onOpenDev} title="Open diagnostics">DEV</Button>
    </div>
    <div className="flex items-center gap-4 text-sm text-slate-600">
      {caseMeta && <div className="hidden md:flex items-center gap-2"><span className="text-slate-400">Case:</span> <b>{caseMeta.id}</b> <span className="text-slate-400">•</span> <span className="truncate max-w-[200px]">{caseMeta.title}</span></div>}
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-slate-500">{user.role}</div>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4 mr-2"/> Logout</Button>
      </div>
    </div>
  </div>
);

/************************************
 * DEV DIAGNOSTICS (runtime test cases)
 ************************************/
const DevDiagnostics = ({ open, setOpen }) => {
  const [results, setResults] = useState([]);

  const runTests = async () => {
    const r = [];
    // 1) Icon availability (using our fallbacks)
    r.push({ name: "Icon: MoreVerticalIcon available", pass: typeof MoreVerticalIcon === "function" });
    r.push({ name: "Icon: PlusIcon available", pass: typeof PlusIcon === "function" });
    // 2) Auth mocks
    const ok = await MockAPI.login({ username: "agent@example.com", password: "demo123" });
    const bad = await MockAPI.login({ username: "x", password: "y" });
    r.push({ name: "Login success path", pass: !!ok.ok });
    r.push({ name: "Login failure path", pass: !bad.ok });
    // 2b) SSO mock
    const sso = await MockAPI.ssoAzureAD();
    r.push({ name: "SSO success path", pass: !!sso.ok });
    // 3) Pagination maths
    const { items: f1, total: ft } = await MockAPI.listFolders({});
    r.push({ name: "Folders returned", pass: Array.isArray(f1) && f1.length > 0 && ft >= f1.length });
    // 4) Extraction produces candidates schema
    const { candidates } = await MockAPI.extractCandidates({ caseId: "C-TEST" });
    r.push({ name: "Candidates exist", pass: Array.isArray(candidates) && candidates.length >= 1 });
    const hasFields = ["number","kind","via","confidence","source"].every(k => k in candidates[0]);
    r.push({ name: "Candidate schema valid", pass: hasFields });
    // 5) Regex from web snippet
    const web = await MockAPI.webLookup({ name: "Test", address: "N/A" });
    const extracted = web.map(w => (w.snippet.match(/\(\d{3}\) \d{3}-\d{4}/)?.[0] || "NA"));
    r.push({ name: "Web snippet regex works", pass: extracted.some(v => v !== "NA") });
    // 6) Brand palette correctness
    const paletteOk = CONFIG.theme.bgDarkNavy === "#1A324A" && CONFIG.theme.bgMediumBlue === "#2B539A" && CONFIG.theme.bgLightBlue === "#3296C8" && CONFIG.theme.bgFarLeft === "#2F294F";
    r.push({ name: "Brand hex codes loaded", pass: paletteOk });
    // 7) Confidence bounds check
    const confOk = candidates && candidates.every && candidates.every(c => c.confidence >= 0 && c.confidence <= 1);
    r.push({ name: "Candidate confidence in [0,1]", pass: !!confOk });
    // 8) ThemeVars component presence
    r.push({ name: "ThemeVars component exists", pass: typeof ThemeVars === "function" });

    setResults(r);
  };

  useEffect(() => { if (open) runTests(); }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Developer Diagnostics</DialogTitle>
          <DialogDescription>Quick runtime checks to validate the prototype.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {results.map((x, i) => (
            <div key={i} className="flex items-center justify-between border border-line rounded-lg px-3 py-2 text-sm">
              <div>{x.name}</div>
              <Badge variant={x.pass ? "default" : "secondary"}>{x.pass ? "PASS" : "FAIL"}</Badge>
            </div>
          ))}
          {results.length === 0 && <div className="text-sm text-slate-500">Running tests…</div>}
        </div>
        <DialogFooter>
          <Button className="btn-brand" onClick={()=>setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Workspace = ({ user, onOpenDev }) => {
  const welcomeMessage = "Welcome! Upload mortgage PDFs and I’ll extract phone candidates. If none are found, I can run a public lookup.";
  const [activeCase, setActiveCase] = useState(null);
  const [docs, setDocs] = useState([]);
  const clearDocs = useCallback(() => {
    setDocs(prev => {
      prev.forEach(doc => {
        if (doc?.url) {
          try { URL.revokeObjectURL(doc.url); } catch (_) { /* ignore */ }
        }
      });
      return [];
    });
  }, [setDocs]);
  const [chat, setChat] = useState([ { who: "bot", text: welcomeMessage } ]);
  const [input, setInput] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [webResults, setWebResults] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const send = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setChat(prev => [...prev, { who: "user", text: msg }]);
    setInput("");
    // Very light intent routing
    if (/lookup|web|search/i.test(msg)) {
      setChat(prev => [...prev, { who: "bot", text: "Okay, running a public lookup…" }]);
      const results = await MockAPI.webLookup({ name: activeCase?.title || "Borrower", address: "N/A" });
      setWebResults(results);
      setChat(prev => [...prev, { who: "bot", text: `I found ${results.length} public entries. You can add numbers as candidates from the Web tab.` }]);
    } else if (/extract|phone|candidate/i.test(msg)) {
      if (!activeCase) { setChat(prev => [...prev, { who: "bot", text: "Please select or create a case first." }]); return; }
      setChat(prev => [...prev, { who: "bot", text: "Extracting phone candidates from uploaded documents…" }]);
      const { candidates: found } = await MockAPI.extractCandidates({ caseId: activeCase.id });
      setCandidates(prev => [...prev, ...found]);
      setDrawerOpen(true);
      setChat(prev => [...prev, { who: "bot", text: `Found ${found.length} candidate(s). Opened the list.` }]);
    } else {
      setChat(prev => [...prev, { who: "bot", text: "Try: ‘extract phone’, or ‘run web lookup’." }]);
    }
  };

  const onFilesUploaded = (uploaded) => {
    setDocs(prev => [...prev, ...uploaded]);
    setChat(prev => [...prev, { who: "bot", text: `Uploaded ${uploaded.length} document(s). Say ‘extract phone’.` }]);
  };

  const onSelectPrimary = (c) => {
    setChat(prev => [...prev, { who: "bot", text: `Marked ${c.number} as primary. Case can be closed as Established.` }]);
  };

  const updateUrlState = (nextState = {}, { replace = false } = {}) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const folder = nextState.folder !== undefined ? nextState.folder : selectedFolderId;
    const caseId = nextState.case !== undefined ? nextState.case : activeCase?.id;
    const prevFolder = params.get("folder");
    const prevCase = params.get("case");
    const nextFolder = folder ?? null;
    const nextCase = caseId ?? null;
    if (!replace && prevFolder === nextFolder && prevCase === nextCase) return;
    if (nextFolder) { params.set("folder", nextFolder); } else { params.delete("folder"); }
    if (nextCase) { params.set("case", nextCase); } else { params.delete("case"); }
    const method = replace ? "replaceState" : "pushState";
    const search = params.toString();
    const newUrl = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
    window.history[method]({}, "", newUrl);
  };

  const setCaseContext = (caseData, { syncUrl = true, replaceHistory = false, folderOverride = undefined, preserveData = false } = {}) => {
    if (!caseData) {
      setActiveCase(null);
      clearDocs();
      setCandidates([]);
      setWebResults([]);
      setChat([{ who: "bot", text: welcomeMessage }]);
      setDrawerOpen(false);
      if (syncUrl) {
        const folderValue = folderOverride !== undefined ? folderOverride : selectedFolderId;
        updateUrlState({ folder: folderValue, case: null }, { replace: replaceHistory });
      }
      return;
    }
    const folderForCase = folderOverride !== undefined ? folderOverride : (caseData.folderId || selectedFolderId || null);
    setSelectedFolderId(folderForCase);
    setActiveCase(prev => (preserveData && prev ? { ...prev, ...caseData } : caseData));
    if (!preserveData) {
      clearDocs();
      setCandidates([]);
      setWebResults([]);
      setChat([{ who: "bot", text: `Opened case ${caseData.id}. Upload PDFs to begin.` }]);
      setDrawerOpen(false);
    }
    if (!preserveData) {
      setSidebarCollapsed(false);
    }
    if (syncUrl) {
      updateUrlState({ folder: folderForCase, case: caseData.id }, { replace: replaceHistory });
    }
  };

  const handleSelectFolder = (folder) => {
    const id = folder?.id ?? null;
    if (id === selectedFolderId) return;
    setSelectedFolderId(id);
    setCaseContext(null, { syncUrl: false, folderOverride: id });
    updateUrlState({ folder: id, case: null });
  };

  const createCase = () => {
    const title = prompt("Case / Applicant name?") || `New Applicant ${Math.floor(Math.random()*1000)}`;
    const c = { id: `C-${Math.floor(Math.random()*900000)+100000}`, title, status: "Open", folderId: selectedFolderId || null };
    setCaseContext(c);
    toast.success("Case created");
  };

  const addCandidateFromWeb = (candidate) => {
    setCandidates(prev => {
      if (prev.some(p => p.number === candidate.number && p.source?.type === "web")) {
        return prev;
      }
      return [...prev, candidate];
    });
  };

  const removeCandidateFromWeb = (number) => {
    setCandidates(prev => prev.filter(p => !(p.number === number && p.source?.type === "web")));
  };

  const handleCaseUpdated = (updatedCase, originalId) => {
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
  };

  useEffect(() => {
    const applyUrl = async () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const folderParam = params.get("folder");
      const caseParam = params.get("case");
      if (folderParam) {
        setSelectedFolderId(folderParam);
      } else {
        setSelectedFolderId(null);
      }
      if (caseParam) {
        const { items } = await MockAPI.listCases({ folderId: folderParam || null, q: caseParam, pageSize: 50 });
        const matching = items.find(it => it.id === caseParam);
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
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => { clearDocs(); }, [clearDocs]);

  return (
    <div className="flex flex-1 min-h-0 max-h-full w-full overflow-hidden">
      <div
        className={cn(
          "relative h-full transition-[width] duration-300 ease-in-out overflow-hidden",
          sidebarCollapsed ? "w-0 min-w-0" : "w-[360px] min-w-[280px]"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-300 ease-in-out",
            sidebarCollapsed ? "-translate-x-full pointer-events-none" : "translate-x-0 pointer-events-auto"
          )}
        >
          <Sidebar
            onSelectCase={(c)=>{ setCaseContext(c, { folderOverride: c.folderId || selectedFolderId || null }); }}
            activeCaseId={activeCase?.id}
            onCreateCase={createCase}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
            onUpdateCase={handleCaseUpdated}
          />
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Case header */}
        <div className="px-4 py-3 border-b border-line bg-white/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-500"
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    onClick={()=>setSidebarCollapsed(prev => !prev)}
                  >
                    {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{sidebarCollapsed ? "Show folders" : "Hide folders"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="font-medium">{activeCase ? activeCase.title : "No case selected"}</span>
            {activeCase && <Badge variant="secondary">{activeCase.id}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={()=>setDrawerOpen(true)}><Phone className="h-4 w-4 mr-2"/> Candidates</Button>
            <Button size="sm" className="btn-brand" onClick={()=>setChat(prev=>[...prev,{ who:"bot", text:"Extracting phone candidates from uploaded documents…" }]) && MockAPI.extractCandidates({caseId:activeCase?.id}).then(({candidates:found})=>{ setCandidates(prev=>[...prev,...found]); setDrawerOpen(true); setChat(prev=>[...prev,{ who:"bot", text:`Found ${found.length} candidate(s). Opened the list.` }]); })}>
              <Wand2 className="h-4 w-4 mr-2"/> Extract
            </Button>
            <Button size="sm" variant="ghost" onClick={onOpenDev}>Dev tests</Button>
          </div>
        </div>

        {/* Body */}
        <div className="grid flex-1 min-h-0 grid-cols-2 gap-4 p-4 overflow-hidden">
          <div className="flex flex-col min-h-0">
            <div className="flex-1 rounded-2xl border border-line bg-slate-50 p-4 overflow-auto">
              <div className="space-y-3">
                {chat.map((m, i) => <ChatBubble key={i} who={m.who} text={m.text} />)}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input placeholder="Type a message… (e.g., ‘extract phone’, ‘run web lookup’)" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') send(); }} />
              <Button className="btn-brand" onClick={send}>Send</Button>
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <UploadTray onUploaded={onFilesUploaded} />
            <div className="mt-4 flex-1 rounded-2xl border border-line bg-white p-4 overflow-auto">
              <EvidenceTabs
                docs={docs}
                web={webResults}
                onAddCandidate={addCandidateFromWeb}
                onRemoveCandidate={removeCandidateFromWeb}
                selectedNumbers={candidates.filter(c => c.source?.type === "web").map(c => c.number)}
              />
            </div>
          </div>
        </div>

        <footer className="border-t border-line py-2 px-4 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} {CONFIG.orgName}</span>
            <a className="underline" href="#">Privacy</a>
            <a className="underline" href="#">Acceptable Use</a>
            <a className="underline" href="#">Security overview</a>
          </div>
          <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5"/> v0.1 Prototype</div>
        </footer>
      </div>

      <CandidateDrawer open={drawerOpen} setOpen={setDrawerOpen} candidates={candidates} onSelectPrimary={onSelectPrimary} />
    </div>
  );
};

/************************************
 * ROOT APP
 ************************************/
export default function App() {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem("sessionUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [devOpen, setDevOpen] = useState(false);
  const handleLogin = (nextUser) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sessionUser", JSON.stringify(nextUser));
    }
  };
  const doLogout = () => {
    setUser(null);
    setDevOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("sessionUser");
      const url = new URL(window.location.href);
      window.history.replaceState({}, "", `${url.pathname}${url.hash}`);
    }
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col">
      <ThemeVars />
      {user ? (
        <>
          <HeaderBar user={user} onLogout={doLogout} caseMeta={null} onOpenDev={()=>setDevOpen(true)} />
          <Workspace user={user} onOpenDev={()=>setDevOpen(true)} />
          <DevDiagnostics open={devOpen} setOpen={setDevOpen} />
        </>
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
}
