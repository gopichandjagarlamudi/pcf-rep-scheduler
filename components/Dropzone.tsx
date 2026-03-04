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
    <div className="relative group rounded-lg transition-all hover:bg-slate-50 cursor-pointer overflow-hidden border border-transparent hover:border-slate-100">
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="flex items-center px-4 py-3.5 gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${file ? 'bg-green-50' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
          {file ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <UploadCloud className={`w-5 h-5 ${required ? 'text-indigo-500' : 'text-slate-400'}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            {label}
            {required && !file && <span className="w-1 h-1 bg-indigo-500 rounded-full" />}
          </p>
          <p className={`text-[11px] font-medium truncate ${file ? 'text-slate-500' : 'text-slate-400'}`}>
            {file ? file.name : (required ? 'Required file' : 'Optional attachment')}
          </p>
        </div>
        <div className="flex-shrink-0">
          <ChevronRight className={`w-4 h-4 transition-colors ${file ? 'text-green-300' : 'text-slate-300'}`} />
        </div>
      </div>
    </div>
  );
};