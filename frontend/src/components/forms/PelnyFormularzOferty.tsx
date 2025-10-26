import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { getAuthToken } from '../../utils/auth';

export interface FullOfferFormValues {
  tryb: 'create' | 'edit';
  typ: 'okazja' | 'kupon';
  tytul: string;
  opis: string;
  cena: string;
  cenaPoprzednia: string;
  kod: string;
  kategoria: string;
  sklep: string;
  tagi: string;
  zdjecia?: string[]; // istniejące
}

interface Props {
  initial: FullOfferFormValues;
  onClose: () => void;
  onSaved: () => void;
  uploadOnCreate?: boolean; // create with files
  offerId?: number; // when edit
}

const categories = ['Telefony','Laptopy','Audio','TV','Gaming','Foto','Smartwatche','Tablety','PC','Akcesoria'];

const PelnyFormularzOferty: React.FC<Props> = ({ initial, onClose, onSaved, uploadOnCreate = true, offerId }) => {
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFiles = (list: File[]) => {
    const valid = list.filter(f => f.type.startsWith('image/') && f.size <= 5*1024*1024);
    setFiles(prev => [...prev, ...valid].slice(0,5));
  };

  const removeFile = (i: number) => setFiles(f => f.filter((_,idx)=>idx!==i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      if(!form.tytul.trim()) throw new Error('Tytuł wymagany');
      if(!form.opis.trim()) throw new Error('Opis wymagany');
      if(form.typ==='kupon' && !form.kod.trim()) throw new Error('Kod kuponu wymagany');

      const token = getAuthToken();
      if(!token) throw new Error('Brak tokenu');

      if(form.tryb==='create' && uploadOnCreate){
        const fd = new FormData();
        fd.append('tytul', form.tytul.trim());
        fd.append('opis', form.opis.trim());
        if(form.cena) fd.append('cena', form.cena);
        if(form.typ!=='kupon' && form.cenaPoprzednia) fd.append('cenaPoprzednia', form.cenaPoprzednia);
        if(form.typ==='kupon' && form.kod) fd.append('kod', form.kod.trim());
        fd.append('kategoria', form.kategoria);
        if(form.sklep.trim()) { let url=form.sklep.trim(); if(!/^https?:\/\//i.test(url)) url='https://'+url; fd.append('sklep', url);}    
        if(form.tagi.trim()) fd.append('tagi', form.tagi.trim());
        fd.append('typ', form.typ);
        files.forEach(f=> fd.append('zdjecia', f));
        const res = await fetch('/api/oferta/upload',{method:'POST', headers:{'Authorization':`Bearer ${token}`}, body:fd});
        if(!res.ok) throw new Error('Błąd zapisu');
      } else { // edit JSON update (admin/moderator)
        const payload:any = {};
        if(form.tytul) payload.tytul = form.tytul.trim();
        if(form.opis) payload.opis = form.opis.trim();
        if(form.cena) payload.cena = parseFloat(form.cena.replace(',','.'));
        if(form.typ!=='kupon' && form.cenaPoprzednia) payload.cenaPoprzednia = parseFloat(form.cenaPoprzednia.replace(',','.'));
        if(form.typ==='kupon' && form.kod) payload.kod = form.kod.trim();
        if(form.sklep.trim()) { let url=form.sklep.trim(); if(!/^https?:\/\//i.test(url)) url='https://'+url; payload.link=url; }
        if(form.tagi.trim()) payload.tagi = form.tagi.trim();
        // Moderator używa takiego samego endpointu jak Admin, aby zachować ten sam kontrakt DTO
        const target = `/api/admin/oferta/${offerId}`;
        const res = await fetch(target,{method:'PUT', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify(payload)});
        if(!res.ok) throw new Error('Błąd zapisu');
      }

      setSuccess('Zapisano');
      onSaved();
      setTimeout(()=> onClose(), 800);
    } catch(err:any){
      setError(err.message || 'Błąd');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm">{success}</div>}
      <div>
        <label className="text-xs font-semibold text-gray-600">Tytuł *</label>
        <input name="tytul" value={form.tytul} onChange={change} className="w-full border rounded p-2" placeholder="Tytuł"/>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600">Opis *</label>
        <textarea name="opis" value={form.opis} onChange={change} className="w-full border rounded p-2 h-28" placeholder="Opis"/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-600">Cena</label>
          <input name="cena" value={form.cena} onChange={change} className="w-full border rounded p-2" />
        </div>
        {form.typ!=='kupon' && (
          <div>
            <label className="text-xs font-semibold text-gray-600">Cena poprzednia</label>
            <input name="cenaPoprzednia" value={form.cenaPoprzednia} onChange={change} className="w-full border rounded p-2" />
          </div>
        )}
      </div>
      {form.typ==='kupon' && (
        <div>
          <label className="text-xs font-semibold text-gray-600">Kod kuponu *</label>
          <input name="kod" value={form.kod} onChange={change} className="w-full border rounded p-2" />
        </div>
      )}
      <div>
        <label className="text-xs font-semibold text-gray-600">Kategoria</label>
        <select name="kategoria" value={form.kategoria} onChange={change} className="w-full border rounded p-2">
          {categories.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600">Link</label>
        <input name="sklep" value={form.sklep} onChange={change} className="w-full border rounded p-2" placeholder="https://..." />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600">Tagi</label>
        <input name="tagi" value={form.tagi} onChange={change} className="w-full border rounded p-2" placeholder="tag1 tag2" />
      </div>
      {form.tryb==='create' && (
        <div>
          <label className="text-xs font-semibold text-gray-600">Zdjęcia (max 5)</label>
          <div
            onDragOver={e=>{e.preventDefault(); setDrag(true);}}
            onDragLeave={e=>{e.preventDefault(); setDrag(false);}}
            onDrop={e=>{e.preventDefault(); setDrag(false); handleFiles(Array.from(e.dataTransfer.files));}}
            className={`border-2 border-dashed rounded p-4 text-center ${drag? 'border-blue-400 bg-blue-50':'border-gray-300'}`}
          >
            <p className="text-sm text-gray-600 mb-2">Przeciągnij zdjęcia lub wybierz</p>
            <label className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded cursor-pointer text-sm">
              <Upload className="w-4 h-4 mr-1"/>Wybierz
              <input type="file" className="hidden" multiple accept="image/*" onChange={e=> handleFiles(Array.from(e.target.files||[]))} />
            </label>
            {files.length>0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {files.map((f,i)=>(
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded" />
                    <button type="button" onClick={()=>removeFile(i)} className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Anuluj</button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{loading? 'Zapisywanie...':'Zapisz'}</button>
      </div>
    </form>
  );
};

export default PelnyFormularzOferty;
