// ============================================================
// components/seller/VariantEditor.tsx
// Size × colour grid with a stock count per combination — the
// inventory a real shop needs. Generates the variant list that
// products.variants stores as JSONB.
// ============================================================

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ProductVariant } from '@/context/MarketplaceContext';

interface Props {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function VariantEditor({ variants, onChange }: Props) {
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const sizes = useMemo(
    () => [...new Set(variants.map(v => v.size))],
    [variants]
  );
  const colors = useMemo(
    () => [...new Set(variants.map(v => v.color))],
    [variants]
  );

  const stockAt = (size: string, color: string) =>
    variants.find(v => v.size === size && v.color === color)?.stock ?? 0;

  const setStock = (size: string, color: string, stock: number) => {
    const existing = variants.find(v => v.size === size && v.color === color);
    if (existing) {
      onChange(variants.map(v =>
        v.size === size && v.color === color ? { ...v, stock: Math.max(0, stock) } : v
      ));
    } else {
      onChange([...variants, { size, color, stock: Math.max(0, stock) }]);
    }
  };

  const addSize = (size: string) => {
    const s = size.trim();
    if (!s || sizes.includes(s)) return;
    const targets = colors.length > 0 ? colors : ['Default'];
    onChange([
      ...variants,
      ...targets.map(color => ({ size: s, color, stock: 0 })),
    ]);
    setNewSize('');
  };

  const addColor = (color: string) => {
    const c = color.trim();
    if (!c || colors.includes(c)) return;
    const targets = sizes.length > 0 ? sizes : ['One Size'];
    onChange([
      ...variants,
      ...targets.map(size => ({ size, color: c, stock: 0 })),
    ]);
    setNewColor('');
  };

  const removeSize = (size: string) =>
    onChange(variants.filter(v => v.size !== size));

  const removeColor = (color: string) =>
    onChange(variants.filter(v => v.color !== color));

  const total = variants.reduce((s, v) => s + v.stock, 0);
  const low = variants.filter(v => v.stock > 0 && v.stock <= 3).length;
  const out = variants.filter(v => v.stock === 0).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Inventory — sizes, colours and stock
        </label>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          {total} in stock
          {low > 0 && ` · ${low} low`}
          {out > 0 && ` · ${out} out`}
        </span>
      </div>

      {variants.length === 0 ? (
        <div style={{
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
          padding: '20px 16px', textAlign: 'center',
          fontSize: 'var(--text-body)', color: 'var(--text-tertiary)',
        }}>
          Add a size or colour below to start a stock grid.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: sizes.length * 96 + 120 }}>
            <thead>
              <tr>
                <th style={{ ...hdr, textAlign: 'left', minWidth: 110 }}>Size \ Colour</th>
                {colors.map(color => (
                  <th key={color} style={hdr}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {color}
                      <button type="button" onClick={() => removeColor(color)} aria-label={`Remove colour ${color}`} style={xBtn}>
                        <X size={10} />
                      </button>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map(size => (
                <tr key={size}>
                  <td style={{ ...cell, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {size}
                    <button type="button" onClick={() => removeSize(size)} aria-label={`Remove size ${size}`} style={{ ...xBtn, marginLeft: 6 }}>
                      <X size={10} />
                    </button>
                  </td>
                  {colors.map(color => {
                    const stock = stockAt(size, color);
                    return (
                      <td key={color} style={cell}>
                        <input
                          type="number"
                          min={0}
                          value={stock}
                          onChange={e => setStock(size, color, Number(e.target.value))}
                          aria-label={`Stock for size ${size}, colour ${color}`}
                          style={{
                            width: 60, padding: '6px 8px', textAlign: 'center',
                            border: `1px solid ${stock === 0 ? 'var(--danger)' : stock <= 3 ? 'var(--warning)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-card)', color: 'var(--text-primary)',
                            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-caption)',
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {COMMON_SIZES.filter(s => !sizes.includes(s)).slice(0, 4).map(s => (
            <button key={s} type="button" onClick={() => addSize(s)} className="btn btn-outline btn-sm">
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={newSize}
            onChange={e => setNewSize(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(newSize); } }}
            placeholder="Custom size"
            className="input-base"
            style={{ width: 110, padding: '6px 10px', fontSize: 'var(--text-caption)' }}
          />
          <button type="button" onClick={() => addSize(newSize)} className="btn btn-ghost btn-sm" aria-label="Add size">
            <Plus size={13} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(newColor); } }}
            placeholder="Colour (e.g. Black)"
            className="input-base"
            style={{ width: 150, padding: '6px 10px', fontSize: 'var(--text-caption)' }}
          />
          <button type="button" onClick={() => addColor(newColor)} className="btn btn-ghost btn-sm" aria-label="Add colour">
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: 'var(--text-tertiary)',
  borderBottom: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const cell: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--border)',
  textAlign: 'center',
  fontSize: 'var(--text-caption)',
  color: 'var(--text-secondary)',
};

const xBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-tertiary)',
  padding: 0,
  display: 'inline-flex',
};
