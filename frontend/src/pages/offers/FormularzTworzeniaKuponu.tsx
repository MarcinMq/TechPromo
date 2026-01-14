import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, Tag, Store, FileText, Upload, Image, X, ShoppingBag, Clipboard } from 'lucide-react';
import { getAuthToken, getUserData } from '../../utils/auth';

interface CouponFormData {
  tytul: string;
  opis: string;
  cenaAktualna: string;
  cenaPoprzednia: string;
  kod: string; // Kod promocyjny dla kuponu
  kategoria: string;
  sklep: string;
  tagi: string;
  typ: 'kupon';
  zdjecia: File[];
  bezMinimalnejKwoty: boolean;
  waznoscOd: string;
  waznoscDo: string;
}

const FormularzTworzeniaKuponu: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState<CouponFormData>({
    tytul: '',
    opis: '',
    cenaAktualna: '',
    cenaPoprzednia: '',
    kod: '',
    kategoria: '',
    sklep: '', // używane jako URL do sklepu / oferty
    tagi: '',
    typ: 'kupon',
    zdjecia: [],
    bezMinimalnejKwoty: false,
    waznoscOd: '',
    waznoscDo: ''
  });

  interface ExistingImage { id: number; url: string; kolejnosc: number; }
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const role = getUserData()?.role;



  // Load categories from API
  useEffect(() => {
    fetch('/api/oferta/kategorie')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setCategories(data);
        // Set first category as default if not in edit mode
        if (data.length > 0 && !formData.kategoria) {
          setFormData(prev => ({ ...prev, kategoria: data[0] }));
        }
      })
      .catch(() => { });
  }, []);

  const fetchImages = async (id: number) => {
    const role = getUserData()?.role;
    const token = getAuthToken();
    let photoUrl = '';
    if (role === 'User' || role === 'Uzytkownik') {
      photoUrl = `/api/uzytkownik/oferta/${id}/zdjecia`;
    } else if (role === 'Moderator' || role === 'Admin') {
      photoUrl = `/api/moderator/oferta/${id}/zdjecia`;
    }

    if (photoUrl) {
      try {
        const r = await fetch(photoUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        if (r.ok) {
          const data = await r.json();
          setExistingImages(data.map((x: any) => ({
            id: x.idOfertaZdjecie ?? x.IdOfertaZdjecie,
            url: x.urlZdjecia ?? x.UrlZdjecia,
            kolejnosc: x.kolejnosc ?? x.Kolejnosc
          })));
        }
      } catch (err) { console.log('[DEBUG] Photo fetch error:', err); }
    }
  };

  // Detect edit mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const edit = params.get('edit');
    if (edit) {
      const idNum = parseInt(edit, 10);
      if (!isNaN(idNum)) {
        setEditId(idNum);

        // Użyj tego samego endpointu dla wszystkich ról - pełne dane oferty
        const url = `/api/oferta/${idNum}`;
        fetch(url)
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(data => {
            setFormData(prev => ({
              ...prev,
              tytul: data.tytul || data.Tytul || '',
              opis: data.opis || data.Opis || '',
              cenaAktualna: (data.cena ?? data.Cena)?.toString() || '',
              cenaPoprzednia: (data.cenaPoprzednia ?? data.CenaPoprzednia)?.toString() || '',
              kod: data.kod || data.Kod || '',
              kategoria: data.kategoria || data.Kategoria || 'Telefony',
              sklep: data.sklep || data.Sklep || '',
              tagi: (data.tagi || data.Tagi || []).join(', '),
              typ: 'kupon',
              // Daty ważności
              waznoscOd: data.waznoscOd || data.WaznoscOd ? new Date(data.waznoscOd || data.WaznoscOd).toISOString().slice(0, 16) : '',
              waznoscDo: data.waznoscDo || data.WaznoscDo ? new Date(data.waznoscDo || data.WaznoscDo).toISOString().slice(0, 16) : ''
            }));
          })
          .catch(() => {
            setMessage({ type: 'error', text: 'Brak uprawnień do edycji tej oferty' });
            setTimeout(() => navigate('/konto/profil'), 1500);
          });

        // Pobierz istniejące zdjęcia używając nowej funkcji
        fetchImages(idNum);
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
    if (!formData.kod.trim()) errors.kod = 'Kod promocyjny jest wymagany';
    if (formData.kod.length > 50) errors.kod = 'Kod promocyjny nie może być dłuższy niż 50 znaków';
    if (!formData.bezMinimalnejKwoty && !formData.cenaAktualna) {
      errors.cenaAktualna = 'Minimalna kwota jest wymagana lub zaznacz "Bez minimalnej kwoty"';
    }
    if (formData.cenaAktualna && parseFloat(formData.cenaAktualna) <= 0) errors.cenaAktualna = 'Kwota musi być większa od 0';
    if (formData.cenaPoprzednia && formData.cenaAktualna && parseFloat(formData.cenaPoprzednia) <= parseFloat(formData.cenaAktualna)) {
      errors.cenaPoprzednia = 'Kwota poprzednia powinna być wyższa od aktualnej';
    }
    // Link jest opcjonalny, jeśli podany zostanie automatycznie uzupełniony o https://

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

        // Use the comprehensive User endpoint for everyone (Admins/Moderators/Users)
        // This ensures consistent handling of Category, Tags, and Validity Dates
        putUrl = `/api/uzytkownik/oferta/${editId}`;
        payload = {
          tytul: formData.tytul.trim(),
          opis: formData.opis.trim(),
          cena: formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null,
          cenaPoprzednia: formData.cenaPoprzednia ? parseFloat(formData.cenaPoprzednia) : null,
          kod: formData.kod.trim(),
          link: formData.sklep.trim() || null,
          tagi: formData.tagi.trim() ? formData.tagi.split(',').map(t => t.trim()).filter(t => t) : [],
          kategoria: formData.kategoria || null,
          waznoscOd: formData.waznoscOd || null,
          waznoscDo: formData.waznoscDo || null
        };

        const res = await fetch(putUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Nie udało się zaktualizować kuponu');

        // Zapisz kolejność istniejących zdjęć
        if (existingImages.length > 0) {
          await handleReorderSave();
        }

        // Jeśli są nowe zdjęcia dodane w polu (formData.zdjecia), wyślij je teraz
        let photoUploadSuccess = true;
        if (formData.zdjecia.length > 0) {
          const fd = new FormData();
          formData.zdjecia.forEach(f => fd.append('zdjecia', f));
          let uploadUrl = '';
          if (role === 'User' || role === 'Uzytkownik') uploadUrl = `/api/uzytkownik/oferta/${editId}/zdjecia`;
          else if (role === 'Moderator' || role === 'Admin') uploadUrl = `/api/moderator/oferta/${editId}/zdjecia`;
          if (uploadUrl) {
            const upRes = await fetch(uploadUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
            if (!upRes.ok) {
              // Pobierz szczegóły błędu z backendu (np. odrzucenie przez AI)
              let errorMsg = 'Nie udało się wysłać nowych zdjęć.';
              try {
                const errorData = await upRes.json();
                if (errorData.message) errorMsg = errorData.message;
              } catch { /* ignore */ }
              setMessage({ type: 'error', text: `Kupon zaktualizowany, ale: ${errorMsg}` });
              photoUploadSuccess = false;
            } else {
              await fetchImages(editId);
              setFormData(prev => ({ ...prev, zdjecia: [] }));
            }
          }
        }

        // Pokaż sukces TYLKO jeśli zdjęcia się udały lub ich nie było
        if (photoUploadSuccess) {
          setMessage({ type: 'success', text: role === 'User' ? 'Kupon zaktualizowany! Nowe zdjęcia dodane.' : 'Kupon zaktualizowany.' });
        }
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

      formDataToSend.append('kod', formData.kod.trim());
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

      // Dodaj ważność oferty jeśli wypełnione
      if (formData.waznoscOd) {
        formDataToSend.append('waznoscOd', new Date(formData.waznoscOd).toISOString());
      }
      if (formData.waznoscDo) {
        formDataToSend.append('waznoscDo', new Date(formData.waznoscDo).toISOString());
      }

      // Dodaj pliki zdjęć
      formData.zdjecia.forEach((file) => {
        formDataToSend.append('zdjecia', file);
      });

      console.log('Wysyłanie danych (kupon)');

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
          text: 'Kupon został dodany pomyślnie! Oczekuje na potwierdzenie przez Administrację.'
        });

        // Reset formularza
        setFormData({
          tytul: '',
          opis: '',
          cenaAktualna: '',
          cenaPoprzednia: '',
          kod: '',
          kategoria: 'Telefony',
          sklep: '',
          tagi: '',
          typ: 'kupon',
          zdjecia: [],
          bezMinimalnejKwoty: false,
          waznoscOd: '',
          waznoscDo: ''
        });

        // Przekierowanie po 3 sekundach
        setTimeout(() => {
          navigate('/konto/profil');
        }, 3000);
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Nie udało się dodać oferty');
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
    const base = (role === 'User' || role === 'Uzytkownik') ? '/api/uzytkownik' : '/api/moderator';
    const res = await fetch(`${base}/oferta/${editId}/zdjecie/${imgId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getAuthToken()}` } });
    if (res.ok) setExistingImages(prev => prev.filter(i => i.id !== imgId));
  };
  const handleReorderSave = async () => {
    if (!editId) return;
    const role = getUserData()?.role;
    const base = (role === 'User' || role === 'Uzytkownik') ? '/api/uzytkownik' : '/api/moderator';
    const body = { kolejnosci: existingImages.map((img, idx) => ({ idOfertaZdjecie: img.id, kolejnosc: idx + 1 })) };
    await fetch(`${base}/oferta/${editId}/zdjecia/kolejnosc`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }, body: JSON.stringify(body) });
  };
  const onDragStart = (idx: number) => setDragIndex(idx);
  const onDragOver = (e: React.DragEvent<HTMLDivElement>, idx: number) => { e.preventDefault(); if (dragIndex === null || dragIndex === idx) return; setExistingImages(prev => { const arr = [...prev]; const [m] = arr.splice(dragIndex, 1); arr.splice(idx, 0, m); return arr; }); setDragIndex(idx); };
  const onDragEnd = () => { setDragIndex(null); };

  // Obsługa wklejania zdjęć przez Ctrl+V
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Nadaj nazwę pliku z datą
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const newFile = new File([file], `wklejone-${timestamp}.${file.type.split('/')[1]}`, { type: file.type });
          imageFiles.push(newFile);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      handleFileSelect(imageFiles);
      setMessage({ type: 'success', text: `📋 Wklejono ${imageFiles.length} zdjęcie(cia) ze schowka!` });
      setTimeout(() => setMessage(null), 3000);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900 transition-colors pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8 transition-all">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center transition-colors">
            {editId ? '✏️ Edytuj Kupon' : '🎫 Nowy Kupon'}
          </h1>

          {message && (
            <div className={`p-4 rounded-lg mb-6 text-center font-semibold transition-colors ${message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
              }`}>
              {message.text}
            </div>
          )}

          {editId && existingImages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 transition-colors">Zdjęcia (przeciągnij aby zmienić kolejność – pierwsze = główne)</h2>
              <div className="flex flex-wrap gap-4">
                {existingImages.map((img, idx) => (
                  <div key={img.id}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    className={`relative w-28 h-28 rounded-lg overflow-hidden border-2 ${idx === 0 ? 'border-green-500 dark:border-green-600' : 'border-transparent'} shadow-sm group bg-gray-100 dark:bg-gray-700 transition-colors`}>
                    <img src={`http://localhost:5023${img.url}`} className="w-full h-full object-cover pointer-events-none select-none" />
                    {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-green-600 dark:bg-green-700 text-white text-[10px] text-center py-0.5 transition-colors">Główne</span>}
                    <button type="button" onClick={() => handleExistingDelete(img.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 dark:bg-red-700 text-white flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-colors">×</button>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right">
                <button type="button" onClick={handleReorderSave} className="px-3 py-1 text-xs rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">Zapisz kolejność</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Podstawowe informacje */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border dark:border-gray-700 transition-colors">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center transition-colors">
                <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Podstawowe informacje
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Tytuł kuponu *
                  </label>
                  <input
                    type="text"
                    name="tytul"
                    value={formData.tytul}
                    onChange={handleInputChange}
                    placeholder="np. 20% zniżki na wszystkie smartwatche w Media Expert"
                    required
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {fieldErrors.tytul && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.tytul}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Krótko opisz promocję (max 150 znaków)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Opis kuponu *
                  </label>
                  <textarea
                    name="opis"
                    value={formData.opis}
                    onChange={handleInputChange}
                    placeholder="Opisz warunki użycia kuponu, czas ważności, minimalne kwoty zakupu..."
                    required
                    rows={5}
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {fieldErrors.opis && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.opis}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Szczegółowy opis promocji i warunków (max 1000 znaków)</p>
                </div>
              </div>
            </div>

            {/* Kod promocyjny i ceny */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border dark:border-gray-700 transition-colors">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center transition-colors">
                <ShoppingBag className="w-5 h-5 mr-2 text-pink-600 dark:text-pink-400" />
                Kod promocyjny i kwoty
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Kod promocyjny *
                  </label>
                  <input
                    type="text"
                    name="kod"
                    value={formData.kod}
                    onChange={handleInputChange}
                    placeholder="np. SAVE20, SUPER30"
                    required
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-mono text-lg font-bold"
                  />
                  {fieldErrors.kod && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.kod}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Kod, który trzeba wpisać aby aktywować kupon (max 50 znaków)</p>
                </div>

                {/* Checkbox dla kuponów bez minimalnej kwoty */}
                <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700 transition-colors">
                  <input
                    type="checkbox"
                    id="bezMinimalnejKwoty"
                    checked={formData.bezMinimalnejKwoty}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        bezMinimalnejKwoty: e.target.checked,
                        // Wyczyść kwoty gdy zaznaczamy "bez minimalnej kwoty"
                        ...(e.target.checked ? { cenaAktualna: '', cenaPoprzednia: '' } : {})
                      }));
                    }}
                    className="w-4 h-4 text-purple-600 border-2 border-purple-300 dark:border-purple-600 rounded focus:ring-purple-500 transition-colors"
                  />
                  <label htmlFor="bezMinimalnejKwoty" className="text-sm font-medium text-purple-700 dark:text-purple-400 cursor-pointer transition-colors">
                    🎯 Kupon bez minimalnej kwoty (np. darmowa dostawa, kupony procentowe)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Minimalna kwota poprzednia
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="cenaPoprzednia"
                        value={formData.cenaPoprzednia}
                        onChange={handleInputChange}
                        placeholder="299.00"
                        step="0.01"
                        min="0"
                        disabled={formData.bezMinimalnejKwoty}
                        className={`w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${formData.bezMinimalnejKwoty ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm transition-colors">PLN</span>
                    </div>
                    {fieldErrors.cenaPoprzednia && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.cenaPoprzednia}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      {formData.bezMinimalnejKwoty ?
                        "Pole wyłączone - kupon bez minimalnej kwoty" :
                        "Minimalna kwota przed zastosowaniem kuponu"
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Minimalna kwota z kuponem
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="cenaAktualna"
                        value={formData.cenaAktualna}
                        onChange={handleInputChange}
                        placeholder="199.00"
                        required={!formData.bezMinimalnejKwoty}
                        step="0.01"
                        min="0"
                        disabled={formData.bezMinimalnejKwoty}
                        className={`w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-semibold ${formData.bezMinimalnejKwoty ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400 text-sm font-semibold transition-colors">PLN</span>
                    </div>
                    {fieldErrors.cenaAktualna && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.cenaAktualna}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      {formData.bezMinimalnejKwoty ?
                        "Pole wyłączone - kupon bez minimalnej kwoty" :
                        "Minimalna kwota po zastosowaniu kuponu"
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    <Store className="w-4 h-4 inline mr-1" />
                    Link do oferty / sklepu
                  </label>
                  <input
                    type="text"
                    name="sklep"
                    value={formData.sklep}
                    onChange={handleInputChange}
                    placeholder="https://www.sklep.pl/promocja"
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  />
                  {fieldErrors.sklep && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.sklep}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Pełny URL strony gdzie można użyć kuponu</p>
                </div>

                {/* Kategoria */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors">
                    Kategoria *
                  </label>
                  <select
                    name="kategoria"
                    value={formData.kategoria}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {categories.length === 0 && <option value="">Ładowanie kategorii...</option>}
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.kategoria && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.kategoria}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tagi i Zdjęcia */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border dark:border-gray-700 transition-colors">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center transition-colors">
                <Image className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Tagi i Zdjęcia
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Tagi
                  </label>
                  <input
                    type="text"
                    name="tagi"
                    value={formData.tagi}
                    onChange={handleInputChange}
                    placeholder="np. zniżka, promocja, kupon, blackfriday"
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  {fieldErrors.tagi && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.tagi}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Słowa kluczowe oddzielone przecinkami</p>
                </div>

                {/* Ważność kuponu */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Ważna od (opcjonalnie)
                    </label>
                    <input
                      type="datetime-local"
                      name="waznoscOd"
                      value={formData.waznoscOd}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Ważna do (opcjonalnie)
                    </label>
                    <input
                      type="datetime-local"
                      name="waznoscDo"
                      value={formData.waznoscDo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Zdjęcia */}
                <div>
                  <label className="flex flex-col text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    <div className="flex items-center mb-1">
                      <Image className="w-4 h-4 mr-1" />
                      Zdjęcia kuponu
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal transition-colors">Dodaj do 5 zdjęć (JPG, PNG, max 5MB każde)</span>
                  </label>

                  {/* Upload Area */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${isDragOver
                      ? 'border-indigo-500 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
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
                      <Image className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2 transition-colors">
                        Przeciągnij i upuść zdjęcia tutaj
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mb-3 flex items-center justify-center gap-1">
                        <Clipboard className="w-4 h-4" /> lub wklej ze schowka <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+V</kbd>
                      </p>
                      <label className="inline-flex items-center px-4 py-2 bg-indigo-500 dark:bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-all cursor-pointer">
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
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 transition-colors">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 dark:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 dark:hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 dark:bg-black/80 text-white text-xs p-1 rounded-b-lg transition-colors">
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
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Anuluj
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin inline mr-2" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5 inline mr-2" />
                    {editId ? 'Zapisz zmiany' : 'Dodaj kupon'}
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

export default FormularzTworzeniaKuponu;
