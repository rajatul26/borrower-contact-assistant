const mockDelay = (ms = 700) => new Promise(res => setTimeout(res, ms));

export const MockAPI = {
  async login({ username, password }: { username: string; password: string }) {
    await mockDelay();
    if (username === 'agent@example.com' && password === 'demo123') {
      return { ok: true, user: { id: 'u1', name: 'Case Agent', role: 'Agent' } };
    }
    return { ok: false, error: 'Invalid credentials' };
  },

  async ssoAzureAD() {
    await mockDelay(900);
    return { ok: true, user: { id: 'u-azure', name: 'SSO Agent', role: 'Agent (SSO)' } };
  },

  async listFolders({ q = '', page = 1, pageSize = 6 }: { q?: string; page?: number; pageSize?: number }) {
    await mockDelay(350);
    const all = ['North Region', 'West Region', 'VIP', 'Delinquent Q3', 'Refinance', 'Escalations', 'Developers', 'Training', 'Audit']
      .map((name, idx) => ({ id: `f${idx + 1}`, name }));
    const filtered = all.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { items: filtered.slice(start, end), total: filtered.length };
  },

  async listCases({ folderId = null, q = '', page = 1, pageSize = 10 }: { folderId?: string | null; q?: string; page?: number; pageSize?: number }) {
    await mockDelay(450);
    const all = Array.from({ length: 40 }).map((_, i) => ({
      id: `C-${202500 + i}`,
      title: i % 2 ? `App: John Doe ${i}` : `App: Priya Shah ${i}`,
      folderId: i % 3 === 0 ? 'f1' : i % 3 === 1 ? 'f2' : 'f3',
      status: i % 4 === 0 ? 'Established' : 'Open',
      createdAt: new Date(Date.now() - i * 36e5).toISOString(),
    }));
    const filtered = all.filter(
      c =>
        (!folderId || c.folderId === folderId) &&
        (c.id.toLowerCase().includes(q.toLowerCase()) || c.title.toLowerCase().includes(q.toLowerCase()))
    );
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { items: filtered.slice(start, end), total: filtered.length };
  },

  async uploadDocs(files: File[]) {
    await mockDelay(800);
    return files.map((f, i) => ({ id: `d${Date.now()}-${i}`, name: f.name, pages: Math.ceil(Math.random() * 8) + 1, scanned: true }));
  },

  async extractCandidates({ caseId }: { caseId: string }) {
    await mockDelay(1200);
    const phones = [
      { number: '+1 (415) 555-0134', kind: 'mobile', via: 'regex', confidence: 0.82, source: { type: 'doc', docId: 'd1', page: 2, snippet: 'Borrower: John Doe, Phone: (415) 555-0134' } },
      { number: '+1 650 555 7788', kind: 'mobile', via: 'llm', confidence: 0.73, source: { type: 'doc', docId: 'd2', page: 1, snippet: 'Emergency contact…' } },
      { number: '+1 408 555 9900', kind: 'work', via: 'web', confidence: 0.59, source: { type: 'web', url: 'example.com/profile', snippet: 'Linked profile lists 408-555-9900' } },
    ];
    return { candidates: phones };
  },

  async webLookup({ name, address }: { name: string; address?: string }) {
    await mockDelay(900);
    return [
      { title: `${name} – TruePeopleSearch`, domain: 'truepeoplesearch.com', snippet: 'TruePeople listing shows primary: (650) 555-7788 near last known address.' },
      { title: `${name} on Spokeo`, domain: 'spokeo.com', snippet: 'Spokeo profile indicates mobile (415) 555-0134 and relatives in San Mateo.' },
      { title: `${name} – TruthFinder Report`, domain: 'truthfinder.com', snippet: 'TruthFinder background report suggests potential contact (408) 555-9900.' },
      { title: `${name} – Whitepages Listing`, domain: 'whitepages.com', snippet: 'Whitepages reverse lookup: landline (628) 555-4422 registered to household.' },
      { title: `${name} – Public Records`, domain: 'publicrecords.example', snippet: 'Possible contact: (650) 555-7788' },
      { title: `${name} on ProNet`, domain: 'pronet.example', snippet: 'Mobile listed: 415-555-0134' },
      { title: `${name} – Alumni`, domain: 'alumni.example', snippet: 'Phone: 408-555-9900' },
    ];
  },
};

export type MockUser = Awaited<ReturnType<typeof MockAPI.login>> extends { user: infer U } ? U : never;
