import React, { useState } from 'react';
import { getAuthToken } from '../../utils/auth';

export interface OfferEditValues {
  tytul: string;
  opis: string;
  cena: string;
  cenaPoprzednia: string;
  kod: string;
  kategoria: string;
  sklep: string;
  tagi: string;
  typ: 'okazja' | 'kupon';
}

interface OfferEditFormProps {
  initial: OfferEditValues;
  onClose: () => void;
  onSaved: () => void;
  offerId?: number; // if editing
  endpoint: string; // POST or PUT endpoint (without base /api)
  method: 'POST' | 'PUT';
}

const categories = ['Telefony','Laptopy','Audio','TV','Gaming','Foto','Smartwatche','Tablety','PC','Akcesoria'];

const OfferEditForm: React.FC<OfferEditFormProps> = ({ initial, onClose, onSaved, endpoint, method }) => {
  const [form, setForm] = useState<OfferEditValues>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!form.tytul.trim()) throw new Error('Tytuł jest wymagany');
      if (!form.opis.trim()) throw new Error('Opis jest wymagany');
      if (form.typ === 'kupon' && !form.kod.trim()) throw new Error('Kod kuponu wymagany');

      const payload: any = {
        tytul: form.tytul.trim(),
        opis: form.opis.trim(),
        kategoria: form.kategoria,
        typ: form.typ,
      };
      if (form.cena) payload.cena = parseFloat(form.cena.replace(',','.'));
      if (form.typ !== 'kupon' && form.cenaPoprzednia) payload.cenaPoprzednia = parseFloat(form.cenaPoprzednia.replace(',','.'));
      if (form.typ === 'kupon' && form.kod) payload.kod = form.kod.trim();
      if (form.sklep.trim()) {
        let url = form.sklep.trim();
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        payload.sklep = url;
      }
      if (form.tagi.trim()) payload.tagi = form.tagi.trim();

      const token = getAuthToken();
      const res = await fetch(`/api/${endpoint}`, {
        method,
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Błąd zapisu');
      onSaved();
      onClose();
    } catch (err:any) {
      setError(err.message || 'Błąd');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
      <div className="grid grid-cols-1 gap-4">
        <input name="tytul" value={form.tytul} onChange={change} placeholder="Tytuł" className="px-4 py-2 border rounded" required />
        <textarea name="opis" value={form.opis} onChange={change} placeholder="Opis" className="px-4 py-2 border rounded h-28" required />
        <div className="grid grid-cols-2 gap-4">
          <input name="cena" value={form.cena} onChange={change} placeholder="Cena" className="px-4 py-2 border rounded" />
          {form.typ !== 'kupon' && (
            <input name="cenaPoprzednia" value={form.cenaPoprzednia} onChange={change} placeholder="Cena poprzednia" className="px-4 py-2 border rounded" />
          )}
        </div>
        {form.typ === 'kupon' && (
          <input name="kod" value={form.kod} onChange={change} placeholder="Kod kuponu" className="px-4 py-2 border rounded" required />
        )}
        <select name="kategoria" value={form.kategoria} onChange={change} className="px-4 py-2 border rounded">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input name="sklep" value={form.sklep} onChange={change} placeholder="Link do oferty / sklepu" className="px-4 py-2 border rounded" />
        <input name="tagi" value={form.tagi} onChange={change} placeholder="Tagi (oddzielone spacją)" className="px-4 py-2 border rounded" />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Anuluj</button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{loading? 'Zapisywanie...':'Zapisz'}</button>
      </div>
    </form>
  );
};

export default OfferEditForm;
