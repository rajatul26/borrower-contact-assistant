import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileText, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MockAPI } from '@/lib/mock-api';
import type { UploadedDocument } from '@/features/workspace/types';

type UploadTrayProps = {
  onUploaded: (documents: UploadedDocument[]) => void;
};

type UploadQueueItem = {
  id: number;
  name: string;
  progress: number;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ACCEPTED_TYPES = ['application/pdf'];

const isPdfFile = (file: File) => {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  return file.name.toLowerCase().endsWith('.pdf');
};

export const UploadTray: React.FC<UploadTrayProps> = ({ onUploaded }) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: File[] | FileList) => {
    const arr = Array.from(files).filter(isPdfFile);
    if (arr.length === 0) {
      toast.error('Only PDF files can be uploaded.');
      return;
    }

    setQueue(arr.map((file, index) => ({ id: index, name: file.name, progress: 0 })));

    const fileMeta = arr.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));

    for (let i = 0; i < arr.length; i += 1) {
      for (let progress = 0; progress <= 100; progress += 20) {
        // simulate progress bar so UX is lively
        // eslint-disable-next-line no-await-in-loop
        await delay(120);
        setQueue(prev => prev.map(item => (item.id === i ? { ...item, progress } : item)));
      }
    }

    try {
      const uploaded = await MockAPI.uploadDocs(arr);
      const enriched: UploadedDocument[] = uploaded.map((doc, index) => {
        const meta = fileMeta[index];
        return {
          ...doc,
          name: doc.name || meta?.file?.name || `Document ${index + 1}`,
          file: meta?.file ?? null,
          url: meta?.url ?? null,
          status: 'processing',
          currentStep: 'Validating file',
          stepIndex: 0,
          steps: ['Validating file', 'Virus scan', 'Reading PDF structure', 'Running OCR', 'Extracting entities'],
        };
      });
      onUploaded(enriched);
      toast.success(`${uploaded.length} document(s) uploaded`);
    } catch (error) {
      fileMeta.forEach(meta => {
        if (meta?.url) {
          try {
            URL.revokeObjectURL(meta.url);
          } catch {
            // ignore revoke errors
          }
        }
      });
      toast.error('Upload failed. Please try again.');
    } finally {
      setQueue([]);
    }
  };

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = event => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = event => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragActive(false);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = event => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const files = Array.from(event.dataTransfer?.files || []).filter(isPdfFile);
    if (files.length === 0) {
      toast.error('Only PDF files can be uploaded.');
      return;
    }
    handleFiles(files);
  };

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition bg-white border-line ${dragActive ? 'shadow-md' : ''}`}
      style={dragActive ? { borderColor: 'var(--brand-primary)', backgroundColor: 'rgba(43,83,154,0.08)' } : undefined}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="h-8 w-8 text-brand" />
        <div className="text-sm text-slate-600">Drag &amp; drop mortgage PDFs here, or</div>
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={event => {
            if (event.target.files?.length) {
              handleFiles(event.target.files);
            }
          }}
        />
      </div>
      {queue.length > 0 && (
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
