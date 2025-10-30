import React, { useRef, useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { MockAPI } from '@/lib/mock-api';
import { cn } from '@/lib/utils';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

type UploadedDoc = {
  id: string;
  name: string;
  pages: number;
  file?: File | null;
  url?: string | null;
  status: 'processing' | 'completed' | 'pending' | 'error';
  currentStep: string;
  stepIndex: number;
  steps: string[];
};

type UploadTrayProps = {
  onUploaded: (docs: UploadedDoc[]) => void;
};

export const UploadTray: React.FC<UploadTrayProps> = ({ onUploaded }) => {
  const [queue, setQueue] = useState<Array<{ id: number; name: string; progress: number }>>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: File[] | FileList) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setQueue(arr.map((f, i) => ({ id: i, name: f.name, progress: 0 })));
    const fileMeta = arr.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));

    for (let i = 0; i < arr.length; i++) {
      for (let p = 0; p <= 100; p += 20) {
        await sleep(120);
        setQueue(prev => prev.map(it => (it.id === i ? { ...it, progress: p } : it)));
      }
    }

    try {
      const uploaded = await MockAPI.uploadDocs(arr);
      const enriched: UploadedDoc[] = uploaded.map((doc, idx) => {
        const meta = fileMeta[idx] || {};
        return {
          ...doc,
          name: doc.name || meta.file?.name || `Document ${idx + 1}`,
          file: meta.file || null,
          url: meta.url || null,
          status: 'processing' as const,
          currentStep: 'Validating file',
          stepIndex: 0,
          steps: ['Validating file', 'Virus scan', 'Reading PDF structure', 'Running OCR', 'Extracting entities'],
        };
      });
      onUploaded(enriched);
      toast.success(`${uploaded.length} document(s) uploaded`);
    } catch (err) {
      fileMeta.forEach(meta => {
        if (meta?.url) {
          try {
            URL.revokeObjectURL(meta.url);
          } catch {
            // ignore
          }
        }
      });
      toast.error('Upload failed. Please try again.');
    } finally {
      setQueue([]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!files.length) {
      toast.error('Only PDF files can be uploaded.');
      return;
    }
    handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragActive(false);
  };

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-dashed p-6 text-center transition bg-white border-line',
        dragActive && 'shadow-md'
      )}
      style={dragActive ? { borderColor: 'var(--brand-primary)', backgroundColor: 'rgba(43,83,154,0.08)' } : undefined}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="h-8 w-8 text-brand" />
        <div className="text-sm text-slate-600">Drag & drop mortgage PDFs here, or</div>
        <Button variant="outline" onClick={() => inputRef.current?.click()}>Browse files</Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files?.length) handleFiles(e.target.files);
          }}
        />
      </div>
      {!!queue.length && (
        <div className="mt-4 text-left space-y-3">
          {queue.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <FileText className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-sm">{item.name}</div>
                <Progress value={item.progress} className="h-2" />
              </div>
              <div className="text-xs text-slate-500 w-12 text-right">{item.progress}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadTray;
