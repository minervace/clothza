// ============================================================
// components/seller/ImageUploadInput.tsx
// URL field + "Upload" button pair. Uploading puts the image in
// Supabase Storage and writes the public URL into the field.
// ============================================================

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { uploadImage, MAX_IMAGE_BYTES } from '@/lib/supabaseStorage';

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  hint?: string;
  placeholder?: string;
}

export function ImageUploadInput({ label, value, onChange, folder, hint, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const result = await uploadImage(file, folder);
      if (!result.ok) {
        setError(result.error ?? 'Upload failed');
        return;
      }
      onChange(result.url!);
    } catch {
      setError('Upload failed — check your connection.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <Input
        label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'https://…'}
        hint={undefined}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {busy ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => void handleFile(e.target.files?.[0])}
        />
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          {hint ?? `PNG/JPG/WebP, max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB`}
        </span>
      </div>
      {error && (
        <div role="alert" style={{ color: 'var(--danger)', fontSize: 'var(--text-caption)', marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}
