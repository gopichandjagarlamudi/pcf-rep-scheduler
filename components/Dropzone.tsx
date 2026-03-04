import React from 'react';
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
    <label className="block border border-slate-200 rounded-md p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {label}
            {required ? ' *' : ''}
          </p>
          <p className="text-xs text-slate-500 mt-1">{file ? file.name : required ? 'Required file' : 'Optional attachment'}</p>
        </div>
      </div>
      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleChange} className="mt-2 block w-full text-xs text-slate-600" />
    </label>
  );
};
