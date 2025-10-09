import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Clock, Tag, Store, FileText, Upload, Image, X } from 'lucide-react';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
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
            setTimeout(()=> navigate('/konto/profil'), 1500);
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
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.tytul.trim()) errors.tytul = 'Tytuł jest wymagany';
    if (formData.tytul.length > 150) errors.tytul = 'Tytuł nie może być dłuższy niż 150 znaków';
    if (!formData.opis.trim()) errors.opis = 'Opis jest wymagany';
    if (formData.opis.length > 1000) errors.opis = 'Opis nie może być dłuższy niż 1000 znaków';
    if (!formData.kategoria) errors.kategoria = 'Kategoria jest wymagana';
    if (!formData.cenaAktualna) errors.cenaAktualna = 'Cena promocyjna jest wymagana';
    if (formData.cenaAktualna && parseFloat(formData.cenaAktualna) <= 0) errors.cenaAktualna = 'Cena musi być większa od 0';
    if (formData.cenaPoprzednia && formData.cenaAktualna && parseFloat(formData.cenaPoprzednia) <= parseFloat(formData.cenaAktualna)) {
      errors.cenaPoprzednia = 'Cena poprzednia powinna być wyższa od promocyjnej';
    }
    if (formData.sklep && !formData.sklep.match(/^https?:\/\/.+/)) {
      errors.sklep = 'Link musi zaczynać się od http:// lub https://';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Walidacja formularza
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const token = getAuthToken();
      if (!token) throw new Error('Brak tokenu uwierzytelniającego. Zaloguj się ponownie.');

      // Edit mode: send JSON PUT
      if (editId) {
        let putUrl = '';
        let payload: any = {};

        if (role === 'Admin' || role === 'Moderator') {
          // Ujednolicamy ścieżkę edycji – Moderator używa tego samego endpointu co Admin
          putUrl = `/api/admin/oferta/${editId}`;
          payload = {
            tytul: formData.tytul.trim(),
            opis: formData.opis.trim(),
            cena: formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null,
            cenaPoprzednia: formData.cenaPoprzednia ? parseFloat(formData.cenaPoprzednia) : null,
            kod: null,
            // Wysyłamy pusty string, jeśli pole jest puste – pozwala to wyczyścić link w backendzie
            link: formData.sklep !== undefined ? formData.sklep.trim() : ''
          };
        } else { // User
          putUrl = `/api/uzytkownik/oferta/${editId}`;
          payload = {
            tytul: formData.tytul.trim(),
            opis: formData.opis.trim(),
            cena: formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null,
            cenaPoprzednia: formData.cenaPoprzednia ? parseFloat(formData.cenaPoprzednia) : null,
            kod: null,
            // Dla użytkownika pozostawiamy dotychczasowe zachowanie
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
          navigate('/konto/profil');
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">
            {editId ? '✏️ Edytuj Okazję' : '🛍️ Nowa Okazja'}
          </h1>

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
            {/* Podstawowe informacje */}
            <div className="bg-gradient-to-br from-blue-50/50 to-white/80 rounded-2xl p-6 border border-blue-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Podstawowe informacje
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tytuł okazji *
                  </label>
                  <input
                    type="text"
                    name="tytul"
                    value={formData.tytul}
                    onChange={handleInputChange}
                    placeholder="np. iPhone 15 Pro 128GB - 23% taniej w Media Expert"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {fieldErrors.tytul && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.tytul}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Krótko opisz produkt i promocję (max 150 znaków)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Opis *
                  </label>
                  <textarea
                    name="opis"
                    value={formData.opis}
                    onChange={handleInputChange}
                    placeholder="Opisz produkt, jego specyfikację, warunki promocji, dostępność..."
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {fieldErrors.opis && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.opis}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Szczegółowy opis produktu i warunków promocji (max 1000 znaków)</p>
                </div>
              </div>
            </div>

            {/* Ceny i sklep */}
            <div className="bg-gradient-to-br from-green-50/50 to-white/80 rounded-2xl p-6 border border-green-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-green-600" />
                Ceny i sklep
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cena poprzednia
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PLN</span>
                    </div>
                    {fieldErrors.cenaPoprzednia && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.cenaPoprzednia}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Cena przed promocją</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cena promocyjna *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="cenaAktualna"
                        value={formData.cenaAktualna}
                        onChange={handleInputChange}
                        placeholder="4599.99"
                        required
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-red-600 font-semibold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-sm font-semibold">PLN</span>
                    </div>
                    {fieldErrors.cenaAktualna && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.cenaAktualna}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Aktualna cena promocyjna</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Store className="w-4 h-4 inline mr-1" />
                    Link do oferty / sklepu
                  </label>
                  <input
                    type="text"
                    name="sklep"
                    value={formData.sklep}
                    onChange={handleInputChange}
                    placeholder="https://www.sklep.pl/produkt"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                  {fieldErrors.sklep && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.sklep}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Pełny URL do oferty w sklepie</p>
                </div>

                {/* Kategoria */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Kategoria *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, kategoria: category.name }));
                          if (fieldErrors.kategoria) {
                            setFieldErrors(prev => ({ ...prev, kategoria: '' }));
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all text-center hover:scale-105 ${
                          formData.kategoria === category.name
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{category.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{category.name}</div>
                      </button>
                    ))}
                  </div>
                  {fieldErrors.kategoria && (
                    <p className="mt-2 text-sm text-red-500">{fieldErrors.kategoria}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tagi i Zdjęcia */}
            <div className="bg-gradient-to-br from-purple-50/50 to-white/80 rounded-2xl p-6 border border-purple-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2 text-purple-600" />
                Tagi i Zdjęcia
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Tagi
                  </label>
                  <input
                    type="text"
                    name="tagi"
                    value={formData.tagi}
                    onChange={handleInputChange}
                    placeholder="np. apple, smartphone, promocja"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {fieldErrors.tagi && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.tagi}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Słowa kluczowe oddzielone przecinkami</p>
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
                        ? 'border-purple-500 bg-purple-50' 
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
                      <label className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all cursor-pointer">
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
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 transition-all"
              >
                Anuluj
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin inline mr-2" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 inline mr-2" />
                    {editId ? 'Zapisz zmiany' : 'Opublikuj Okazję'}
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
