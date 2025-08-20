import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Clock, Tag, Store, DollarSign, FileText, Upload, Image, X } from 'lucide-react';
import { getAuthToken, getUserData } from '../../utils/auth';

interface OfferFormData {
  tytul: string;
  opis: string;
  cenaAktualna: string;
  cenaPoprzednia: string;
  kategoria: string;
  sklep: string;
  tagi: string;
  typ: 'okazja';
  zdjecia: File[];
}

// Te same kategorie co na stronie głównej
const categories = [
  { name: 'Telefony', icon: '📱' },
  { name: 'Laptopy', icon: '💻' },
  { name: 'Audio', icon: '🎧' },
  { name: 'TV', icon: '📺' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Foto', icon: '📷' },
  { name: 'Smartwatche', icon: '⌚' },
  { name: 'Tablety', icon: '📱' },
  { name: 'PC', icon: '🖥️' },
  { name: 'Akcesoria', icon: '🔌' },
];

const CreateDealForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<OfferFormData>({
    tytul: '',
    opis: '',
    cenaAktualna: '',
    cenaPoprzednia: '',
    kategoria: 'Telefony',
  sklep: '', // używane jako URL do sklepu / oferty
    tagi: '',
    typ: 'okazja',
    zdjecia: []
  });

  interface ExistingImage { id: number; url: string; kolejnosc: number; }
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const role = getUserData()?.role;

  const refreshExistingImages = async (offerId:number) => {
    try {
      const token = getAuthToken();
      if(!token) return;
      let listUrl = '';
      if(role === 'User') listUrl = `/api/uzytkownik/oferta/${offerId}/zdjecia`;
      else if(role === 'Moderator' || role === 'Admin') listUrl = `/api/moderator/oferta/${offerId}/zdjecia`;
      if(!listUrl) return;
      const resp = await fetch(listUrl, { headers: { 'Authorization': `Bearer ${token}` }});
      if(!resp.ok) return;
      const data = await resp.json();
      setExistingImages((data||[]).map((x:any)=>({ id: x.idOfertaZdjecie ?? x.IdOfertaZdjecie, url: x.urlZdjecia ?? x.UrlZdjecia, kolejnosc: x.kolejnosc ?? x.Kolejnosc })));
    } catch { /* ignore */ }
  };

  // Detect edit mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const edit = params.get('edit');
    if (edit) {
      const idNum = parseInt(edit, 10);
      if (!isNaN(idNum)) {
        setEditId(idNum);
        const role = getUserData()?.role;
        const url = role === 'User' ? `/api/uzytkownik/oferta/${idNum}` : `/api/oferta/${idNum}`;
        fetch(url)
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(data => {
            setFormData(prev => ({
              ...prev,
              tytul: data.tytul || data.Tytul || '',
              opis: data.opis || data.Opis || '',
              cenaAktualna: (data.cena ?? data.Cena)?.toString() || '',
              cenaPoprzednia: (data.cenaPoprzednia ?? data.CenaPoprzednia)?.toString() || '',
              kategoria: data.kategoria || data.Kategoria || 'Telefony',
              sklep: data.sklep || data.Sklep || '',
              tagi: (data.tagi || data.Tagi || []).join(', '),
              typ: 'okazja'
            }));
          })
          .catch(() => {
            setMessage({ type: 'error', text: 'Brak uprawnień do edycji tej oferty' });
            setTimeout(()=> navigate('/uzytkownik/panel'), 1500);
          });
        // Pobierz istniejące zdjęcia
        const token = getAuthToken();
        const imageFetches: Promise<any>[] = [];
        if (role === 'User') {
          imageFetches.push(fetch(`/api/uzytkownik/oferta/${idNum}/zdjecia`, { headers: { 'Authorization': `Bearer ${token}` }}));
        } else if (role === 'Moderator' || role === 'Admin') {
          imageFetches.push(fetch(`/api/moderator/oferta/${idNum}/zdjecia`, { headers: { 'Authorization': `Bearer ${token}` }}));
        }
        Promise.all(imageFetches)
          .then(responses => Promise.all(responses.filter(r=>r.ok).map(r=>r.json())))
          .then(allLists => {
            const merged = allLists.flat();
            setExistingImages(merged.map((x:any)=>({ id: x.idOfertaZdjecie ?? x.IdOfertaZdjecie, url: x.urlZdjecia ?? x.UrlZdjecia, kolejnosc: x.kolejnosc ?? x.Kolejnosc })));
          }).catch(()=>{});
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Walidacja podstawowa
      if (!formData.tytul.trim()) {
        throw new Error('Tytuł jest wymagany');
      }
      if (!formData.opis.trim()) {
        throw new Error('Opis jest wymagany');
      }
      if (!formData.kategoria) {
        throw new Error('Kategoria jest wymagana');
      }

      const token = getAuthToken();
      if (!token) throw new Error('Brak tokenu uwierzytelniającego. Zaloguj się ponownie.');

      // Edit mode: send JSON PUT
      if (editId) {
        let putUrl = '';
        let payload: any = {};

        if (role === 'Admin') {
          putUrl = `/api/admin/oferta/${editId}`;
          payload = {
            tytul: formData.tytul.trim(),
            opis: formData.opis.trim(),
            cena: formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null,
            cenaPoprzednia: formData.cenaPoprzednia ? parseFloat(formData.cenaPoprzednia) : null,
            kod: null,
            link: formData.sklep.trim() || null
          };
        } else if (role === 'Moderator') {
          putUrl = `/api/moderator/oferta/${editId}/edytuj`;
          payload = {
            nowyTytul: formData.tytul.trim(),
            nowyOpis: formData.opis.trim(),
            powod: 'Aktualizacja treści przez moderatora'
          };
        } else { // User
          putUrl = `/api/uzytkownik/oferta/${editId}`;
          payload = {
            tytul: formData.tytul.trim(),
            opis: formData.opis.trim(),
            cena: formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null,
            cenaPoprzednia: formData.cenaPoprzednia ? parseFloat(formData.cenaPoprzednia) : null,
            kod: null,
            link: formData.sklep.trim() || null
          };
        }

        const res = await fetch(putUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Nie udało się zaktualizować oferty');

        // Jeśli są nowe zdjęcia dodane w polu (formData.zdjecia), wyślij je teraz
        if(formData.zdjecia.length > 0){
          const fd = new FormData();
          formData.zdjecia.forEach(f => fd.append('zdjecia', f));
          let uploadUrl = '';
            if (role === 'User') uploadUrl = `/api/uzytkownik/oferta/${editId}/zdjecia`;
            else if (role === 'Moderator' || role === 'Admin') uploadUrl = `/api/moderator/oferta/${editId}/zdjecia`;
          if(uploadUrl){
            const upRes = await fetch(uploadUrl, { method:'POST', headers:{'Authorization': `Bearer ${token}`}, body: fd });
            if(!upRes.ok){
              setMessage({ type:'error', text:'Oferta zaktualizowana, ale nie udało się wysłać nowych zdjęć.' });
            } else {
              await refreshExistingImages(editId);
              setFormData(prev=>({...prev, zdjecia:[]}));
            }
          }
        }

        setMessage({ type: 'success', text: role === 'User' ? 'Oferta zaktualizowana (oczekuje na ponowną moderację). Nowe zdjęcia dodane.' : 'Oferta zaktualizowana.' });
        // Nie przekierowujemy od razu – użytkownik może dalej edytować zdjęcia
        return;
      }
      // Przygotuj dane do wysłania jako FormData
      const formDataToSend = new FormData();
      formDataToSend.append('tytul', formData.tytul.trim());
      formDataToSend.append('opis', formData.opis.trim());
      
      if (formData.cenaAktualna) {
        formDataToSend.append('cena', formData.cenaAktualna);
      }
      if (formData.cenaPoprzednia) {
        formDataToSend.append('cenaPoprzednia', formData.cenaPoprzednia);
      }
      
      formDataToSend.append('kategoria', formData.kategoria);
      if (formData.sklep.trim()) {
        let url = formData.sklep.trim();
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url; // automatyczne dodanie protokołu
        }
        formDataToSend.append('sklep', url);
      }
      if (formData.tagi.trim()) {
        formDataToSend.append('tagi', formData.tagi.trim());
      }
      formDataToSend.append('typ', formData.typ);

      // Dodaj pliki zdjęć
      formData.zdjecia.forEach((file) => {
        formDataToSend.append('zdjecia', file);
      });

      console.log('Wysyłanie danych (okazja)');

      // Wyślij jako FormData z prawidłowym tokenem
      const response = await fetch('/api/oferta/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Nie dodawaj Content-Type dla FormData - przeglądarka ustawi automatycznie z boundary
        },
        body: formDataToSend
      });
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `${formData.typ === 'okazja' ? 'Okazja' : 'Kupon'} została dodana pomyślnie! Oczekuje na potwierdzenie przez Administrację.` 
        });
        
        // Reset formularza
        setFormData({
          tytul: '',
          opis: '',
          cenaAktualna: '',
          cenaPoprzednia: '',
          kategoria: 'Telefony',
          sklep: '',
          tagi: '',
          typ: 'okazja',
          zdjecia: []
        });

        // Przekierowanie po 3 sekundach
        setTimeout(() => {
          navigate('/uzytkownik/panel');
        }, 3000);
      } else {
        const errorData = await response.text();
        throw new Error(`Błąd (${response.status}): ${errorData || 'Nie udało się dodać oferty'}`);
      }
    } catch (error: any) {
      console.error('Błąd:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Wystąpił nieoczekiwany błąd' 
      });
    } finally {
      setLoading(false);
    }
  };

  // File handling functions
  const handleFileSelect = (files: File[]) => {
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Dozwolone są tylko pliki graficzne (JPG, PNG, etc.)' });
        return false;
      }
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: `Plik ${file.name} jest za duży. Maksymalny rozmiar to 5MB.` });
        return false;
      }
      return true;
    });

    setFormData(prev => {
      const newFiles = [...prev.zdjecia, ...validFiles];
      if (newFiles.length > 5) {
        setMessage({ type: 'error', text: 'Można dodać maksymalnie 5 zdjęć' });
        return { ...prev, zdjecia: newFiles.slice(0, 5) };
      }
      return { ...prev, zdjecia: newFiles };
    });

    // Clear any previous error messages if files are valid
    if (validFiles.length > 0) {
      setMessage(null);
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      zdjecia: prev.zdjecia.filter((_, i) => i !== index)
    }));
  };

  const handleExistingDelete = async (imgId: number) => {
    if (!editId) return; if (!confirm('Usunąć zdjęcie?')) return;
    const role = getUserData()?.role;
    const base = role === 'User' ? '/api/uzytkownik' : '/api/moderator';
    const res = await fetch(`${base}/oferta/${editId}/zdjecie/${imgId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getAuthToken()}` }});
    if (res.ok) setExistingImages(prev => prev.filter(i => i.id !== imgId));
  };
  const handleReorderSave = async () => {
    if (!editId) return;
    const role = getUserData()?.role;
    const base = role === 'User' ? '/api/uzytkownik' : '/api/moderator';
    const body = { kolejnosci: existingImages.map((img, idx) => ({ idOfertaZdjecie: img.id, kolejnosc: idx+1 })) };
    await fetch(`${base}/oferta/${editId}/zdjecia/kolejnosc`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${getAuthToken()}` }, body: JSON.stringify(body)});
  };
  const onDragStart = (idx:number) => setDragIndex(idx);
  const onDragOver = (e:React.DragEvent<HTMLDivElement>, idx:number) => { e.preventDefault(); if (dragIndex===null||dragIndex===idx) return; setExistingImages(prev => { const arr=[...prev]; const [m]=arr.splice(dragIndex,1); arr.splice(idx,0,m); return arr; }); setDragIndex(idx); };
  const onDragEnd = () => { setDragIndex(null); };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">{editId ? '✏️ Edytuj Okazję' : '🛍️ Nowa Okazja'}</h1>

          {message && (
            <div className={`p-4 rounded-2xl mb-6 text-center font-semibold backdrop-blur-sm ${
              message.type === 'success' 
                ? 'bg-green-100/80 text-green-700 border border-green-200/50' 
                : 'bg-red-100/80 text-red-700 border border-red-200/50'
            }`}>
              {message.text}
            </div>
          )}

          {editId && existingImages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Zdjęcia (przeciągnij aby zmienić kolejność – pierwsze = główne)</h2>
              <div className="flex flex-wrap gap-4">
                {existingImages.map((img, idx) => (
                  <div key={img.id}
                       draggable
                       onDragStart={() => onDragStart(idx)}
                       onDragOver={(e)=>onDragOver(e, idx)}
                       onDragEnd={onDragEnd}
                       className={`relative w-28 h-28 rounded-xl overflow-hidden border-2 ${idx===0? 'border-green-500':'border-transparent'} shadow group bg-gray-100`}> 
                    <img src={`http://localhost:5023${img.url}`} className="w-full h-full object-cover pointer-events-none select-none" />
                    {idx===0 && <span className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-[10px] text-center py-0.5">Główne</span>}
                    <button type="button" onClick={()=>handleExistingDelete(img.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs opacity-80 hover:opacity-100">×</button>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right">
                <button type="button" onClick={handleReorderSave} className="px-3 py-1 text-xs rounded bg-custom-blue text-white hover:bg-blue-700">Zapisz kolejność</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tytuł */}
            <div>
              <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center mb-1">
                  <FileText className="w-4 h-4 mr-1" />
                  Tytuł okazji *
                </div>
                <span className="text-xs text-gray-500 font-normal">Krótko opisz produkt i promocję</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="tytul"
                  value={formData.tytul}
                  onChange={handleInputChange}
                  placeholder="np. iPhone 15 Pro 128GB - 23% taniej w Media Expert"
                  className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  required
                />
                <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Opis */}
            <div>
              <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center mb-1">
                  <FileText className="w-4 h-4 mr-1" />
                  Opis *
                </div>
                <span className="text-xs text-gray-500 font-normal">Szczegółowy opis produktu i warunków promocji</span>
              </label>
              <textarea
                name="opis"
                value={formData.opis}
                onChange={handleInputChange}
                placeholder="Opisz produkt, jego specyfikację, warunki promocji, dostępność..."
                rows={4}
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all resize-none"
                required
              />
            </div>

            {/* Ceny - poprzednia i aktualna */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center mb-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Cena poprzednia
                  </div>
                  <span className="text-xs text-gray-500 font-normal">Cena przed promocją</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="cenaPoprzednia"
                    value={formData.cenaPoprzednia}
                    onChange={handleInputChange}
                    placeholder="5999.99"
                    step="0.01"
                    min="0"
                    className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  />
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center mb-1">
                    <DollarSign className="w-4 h-4 mr-1 text-red-500" />
                    Cena promocyjna *
                  </div>
                  <span className="text-xs text-gray-500 font-normal">Aktualna cena promocyjna</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="cenaAktualna"
                    value={formData.cenaAktualna}
                    onChange={handleInputChange}
                    placeholder="4599.99"
                    step="0.01"
                    min="0"
                    className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                    required
                  />
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                </div>
              </div>
            </div>

            {/* Link do oferty */}
            <div>
              <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center mb-1">
                  <Store className="w-4 h-4 mr-1" />
                  Link do oferty / sklepu
                </div>
                <span className="text-xs text-gray-500 font-normal">Pełny URL (np. https://www.sklep.pl/produkt)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="sklep"
                  value={formData.sklep}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                />
                <Store className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Kategoria - ładny wybór z ikonkami */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Kategoria *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map(category => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, kategoria: category.name }))}
                    className={`p-3 rounded-xl border transition-all text-center hover:scale-105 ${
                      formData.kategoria === category.name
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md'
                        : 'bg-white/90 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.icon}</div>
                    <div className="text-xs font-medium">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tagi */}
            <div>
              <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center mb-1">
                  <Tag className="w-4 h-4 mr-1" />
                  Tagi
                </div>
                <span className="text-xs text-gray-500 font-normal">Słowa kluczowe oddzielone przecinkami</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="tagi"
                  value={formData.tagi}
                  onChange={handleInputChange}
                  placeholder="np. apple, smartphone, promocja"
                  className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                />
                <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Zdjęcia */}
            <div>
              <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center mb-1">
                  <Image className="w-4 h-4 mr-1" />
                  Zdjęcia oferty
                </div>
                <span className="text-xs text-gray-500 font-normal">Dodaj do 5 zdjęć (JPG, PNG, max 5MB każde)</span>
              </label>
              
              {/* Upload Area */}
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all ${
                  isDragOver 
                    ? 'border-custom-blue bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const files = Array.from(e.dataTransfer.files);
                  handleFileSelect(files);
                }}
              >
                <div className="text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Przeciągnij i upuść zdjęcia tutaj lub
                  </p>
                  <label className="inline-flex items-center px-4 py-2 bg-custom-blue text-white rounded-xl hover:bg-custom-blue-dark transition-all cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Wybierz pliki
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Preview Grid */}
              {formData.zdjecia.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                  {formData.zdjecia.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-xl">
                        {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Przyciski */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all text-gray-700 hover:bg-gray-100"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto p-4 border border-transparent rounded-2xl bg-custom-blue text-white font-semibold focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all hover:bg-custom-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin inline mr-2" />
                    Dodawanie...
                  </>
                ) : (
                  <>
                    {editId ? (
                      <>
                        <Rocket className="w-5 h-5 inline mr-2" />
                        Zapisz zmiany
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 inline mr-2" />
                        Opublikuj Okazję
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDealForm;
