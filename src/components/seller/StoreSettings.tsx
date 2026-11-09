// ============================================================
// components/seller/StoreSettings.tsx
// Shop-owner panel: create a boutique, or edit the existing one.
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store as StoreIcon, ExternalLink, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/lib/toast';
import { STORE_THEMES } from '@/lib/constants';
import { ImageUploadInput } from './ImageUploadInput';
import type { Store } from '@/context/MarketplaceContext';

interface Props {
  store?: Store;
  onCreate: (data: {
    name: string; description: string; logo: string; banner: string;
    location: string; instagram?: string; whatsapp?: string; theme: Store['theme'];
  }) => Store | null;
  onSave: (patch: Partial<Store> & { id: string }) => void;
}

type FormState = {
  name: string; description: string; logo: string; banner: string;
  location: string; instagram: string; whatsapp: string; theme: Store['theme'];
};

const emptyForm: FormState = {
  name: '', description: '', logo: '', banner: '',
  location: '', instagram: '', whatsapp: '', theme: 'minimalist',
};

export function StoreSettings({ store, onCreate, onSave }: Props) {
  const [form, setForm] = useState<FormState>(store ? {
    name:        store.name,
    description: store.description,
    logo:        store.logo,
    banner:      store.banner,
    location:    store.location,
    instagram:   store.instagram ?? '',
    whatsapp:    store.whatsapp ?? '',
    theme:       store.theme,
  } : emptyForm);

  const [saving, setSaving] = useState(false);
  const set = (field: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Give your boutique a name.'); return; }

    setSaving(true);
    try {
      if (store) {
        onSave({ id: store.id, ...form, instagram: form.instagram || undefined });
        toast.success('Store updated');
      } else {
        const created = onCreate({ ...form, instagram: form.instagram || undefined });
        if (!created) { toast.error('Could not create the store.'); return; }
        toast.success('Boutique created — add your first product next');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {store ? 'Store settings' : 'Open your boutique'}
        </h2>
        {store && (
          <Link to={`/store/${store.slug}`} className="btn btn-outline btn-sm">
            <ExternalLink size={14} /> View storefront
          </Link>
        )}
      </div>

      <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-body)', marginBottom: 24, maxWidth: 620 }}>
        {store
          ? 'These details appear on your storefront, in search results and on product pages.'
          : 'Customers browse boutiques, not individual sellers. Create yours to start listing clothes.'}
      </p>

      <form onSubmit={submit} style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <Input
          label="Boutique name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Himalayan Threads"
          required
        />

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Description
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            className="input-base"
            placeholder="What do you make? Where do you sew? What makes your pieces different?"
            style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Input
            label="City / location"
            value={form.location}
            onChange={e => set('location', e.target.value)}
            placeholder="Kathmandu, Nepal"
          />
          <Select
            label="Store theme"
            value={form.theme}
            onChange={e => set('theme', e.target.value)}
            options={STORE_THEMES.map(theme => ({ value: theme, label: theme }))}
          />
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Input
            label="Instagram"
            value={form.instagram}
            onChange={e => set('instagram', e.target.value)}
            placeholder="@yourbrand"
          />
          <Input
            label="WhatsApp"
            value={form.whatsapp}
            onChange={e => set('whatsapp', e.target.value)}
            placeholder="+977…"
          />
        </div>

        <ImageUploadInput
          label="Logo image"
          value={form.logo}
          onChange={url => set('logo', url)}
          folder="stores"
          hint="Square image, at least 400×400."
          placeholder="https://…"
        />

        <ImageUploadInput
          label="Banner image"
          value={form.banner}
          onChange={url => set('banner', url)}
          folder="stores"
          hint="Wide image, at least 1200×400."
          placeholder="https://…"
        />

        {(form.logo || form.banner) && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {form.logo && <img src={form.logo} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} />}
            {form.banner && <img src={form.banner} alt="" style={{ height: 64, flex: 1, maxWidth: 280, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} />}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <Button type="submit" variant="accent" isLoading={saving}>
            {store ? <Save size={15} /> : <StoreIcon size={15} />}
            {store ? ' Save changes' : ' Create boutique'}
          </Button>
        </div>
      </form>
    </div>
  );
}
