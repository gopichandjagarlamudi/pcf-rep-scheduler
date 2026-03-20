import React from 'react';
import { FileText, CheckCircle2, ChevronRight, UploadCloud } from 'lucide-react';
import { FileType } from '../types';

interface DropzoneProps {
  label: string;
  type: FileType;
  file: File | null;
  onFileSelect: (type: FileType, file: File) => void;
  required?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ label, type, file, onFileSelect, required }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(type, e.target.files[0]);
    }
  };

  return (
    <div className="group relative cursor-pointer overflow-hidden rounded-2xl border border-transparent transition-all hover:border-slate-200/80 hover:bg-white/70">
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="flex items-center gap-4 px-4 py-4">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-colors ${file ? 'bg-green-50 shadow-soft' : 'bg-slate-100 group-hover:bg-[var(--accent-soft)]'}`}>
          {file ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <UploadCloud className={`w-5 h-5 ${required ? 'text-indigo-500' : 'text-slate-400'}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            {label}
            {required && !file && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
          </p>
          <p className={`truncate text-[11px] font-semibold uppercase tracking-[0.16em] ${file ? 'text-slate-500' : 'text-slate-400'}`}>
            {file ? file.name : (required ? 'Required file' : 'Optional attachment')}
          </p>
        </div>
        <div className="flex-shrink-0">
          <ChevronRight className={`w-4 h-4 transition-colors ${file ? 'text-green-400' : 'text-slate-300 group-hover:text-slate-400'}`} />
        </div>
      </div>
    </div>
  );
};
