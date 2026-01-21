import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Clock, Tag, Store, FileText, Upload, Image, X, Gift, Clipboard } from 'lucide-react';
import { getAuthToken, getUserData } from '../../utils/auth';
import ModalOstrzezeniaDuplikatow from '../../components/modals/ModalOstrzezeniaDuplikatow';

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
  zaDarmo: boolean;
  waznoscOd: string;
  waznoscDo: string;
}

const FormularzTworzeniaOkazji: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<any>(null);
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);
  const linkCheckTimeoutRef = React.useRef<number | null>(null);

  const [formData, setFormData] = useState<OfferFormData>({
    tytul: '',
    opis: '',
    cenaAktualna: '',
    cenaPoprzednia: '',
    kategoria: '',
    sklep: '', // używane jako URL do sklepu / oferty
    tagi: '',
    typ: 'okazja',
    zdjecia: [],
    zaDarmo: false,
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
          console.log('[DEBUG] Refreshed photos:', data.length);
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
              kategoria: data.kategoria || data.Kategoria || 'Telefony',
              sklep: data.sklep || data.Sklep || '',
              tagi: (data.tagi || data.Tagi || []).join(', '),
              typ: 'okazja',
              // Daty ważności - konwersja z ISO do local datetime-local format
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

    // Sprawdź duplikaty po wklejeniu/wpisaniu linku
    if (name === 'sklep' && value.trim().length > 10) {
      // Debounce - sprawdź po 500ms od ostatniej zmiany
      if (linkCheckTimeoutRef.current) clearTimeout(linkCheckTimeoutRef.current);
      linkCheckTimeoutRef.current = setTimeout(() => {
        checkForDuplicatesInBackground(value.trim());
      }, 500);
    }
  };

  const checkForDuplicatesInBackground = async (link: string) => {
    // Sprawdź tylko jeśli mamy tytuł (min 10 znaków) lub link
    if (!formData.tytul.trim() && !link) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      let url = link;
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      const response = await fetch('/api/oferta/sprawdz-duplikaty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nazwa: formData.tytul.trim() || 'Sprawdzanie...',
          link: url || null,
          cena: formData.zaDarmo ? 0 : (formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null)
        })
      });

      if (!response.ok) return;

      const result = await response.json();

      if (result.czyPotencjalnyDuplikat && result.potencjalneDuplikaty && result.potencjalneDuplikaty.length > 0) {
        setDuplicateCheckResult(result);
        setShowDuplicateModal(true);
      }
    } catch (error) {
      // Cicho ignoruj błędy sprawdzania w tle
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.tytul.trim()) errors.tytul = 'Tytuł jest wymagany';
    if (formData.tytul.length > 150) errors.tytul = 'Tytuł nie może być dłuższy niż 150 znaków';
    if (!formData.opis.trim()) errors.opis = 'Opis jest wymagany';
    if (formData.opis.length > 1000) errors.opis = 'Opis nie może być dłuższy niż 1000 znaków';
    if (!formData.kategoria) errors.kategoria = 'Kategoria jest wymagana';

    // Walidacja ceny - nie jest wymagana jeśli oferta jest za darmo
    if (!formData.zaDarmo && !formData.cenaAktualna) {
      errors.cenaAktualna = 'Cena promocyjna jest wymagana (lub zaznacz "Za darmo")';
    }
    // Sprawdź czy cena jest większa od 0 tylko gdy nie jest za darmo i cena została podana
    if (!formData.zaDarmo && formData.cenaAktualna && parseFloat(formData.cenaAktualna) <= 0) {
      errors.cenaAktualna = 'Cena musi być większa od 0';
    }
    if (formData.cenaPoprzednia && formData.cenaAktualna && parseFloat(formData.cenaPoprzednia) <= parseFloat(formData.cenaAktualna)) {
      errors.cenaPoprzednia = 'Cena poprzednia powinna być wyższa od promocyjnej';
    }
    // Link jest opcjonalny, jeśli podany zostanie automatycznie uzupełniony o https://

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkForDuplicates = async (): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) return true;

      let url = formData.sklep.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      const response = await fetch('/api/oferta/sprawdz-duplikaty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nazwa: formData.tytul.trim(),
          link: url || null,
          cena: formData.zaDarmo ? 0 : (formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null)
        })
      });

      if (!response.ok) {
        return true; // Kontynuuj w przypadku błędu API
      }

      const result = await response.json();
      setDuplicateCheckResult(result);

      if (result.czyPotencjalnyDuplikat && result.potencjalneDuplikaty && result.potencjalneDuplikaty.length > 0) {
        setShowDuplicateModal(true);
        return false; // Zatrzymaj wysyłanie formularza
      }

      return true; // Brak duplikatów, kontynuuj
    } catch (error) {
      return true; // Kontynuuj w przypadku błędu
    }
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
        // This ensures consistent handling of Category, Tags, and Validity Dates which were missing in Admin/Mod payload
        putUrl = `/api/uzytkownik/oferta/${editId}`;
        payload = {
          tytul: formData.tytul.trim(),
          opis: formData.opis.trim(),
          cena: formData.zaDarmo ? 0 : (formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null),
          cenaPoprzednia: formData.cenaPoprzednia ? parseFloat(formData.cenaPoprzednia) : null,
          kod: null,
          link: formData.sklep.trim() || null,
          tagi: formData.tagi.trim() ? formData.tagi.split(',').map(t => t.trim()).filter(t => t) : [],
          kategoria: formData.kategoria || null,
          waznoscOd: formData.waznoscOd || null,
          waznoscDo: formData.waznoscDo || null
        };

        console.log('[DEBUG] Wysyłam PUT do:', putUrl);
        console.log('[DEBUG] Payload:', payload);

        const res = await fetch(putUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });

        console.log('[DEBUG] Response status:', res.status, res.ok);
        const responseText = await res.clone().text();
        console.log('[DEBUG] Response body:', responseText);

        if (!res.ok) throw new Error('Nie udało się zaktualizować oferty: ' + responseText);

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
              setMessage({ type: 'error', text: `Oferta zaktualizowana, ale: ${errorMsg}` });
              photoUploadSuccess = false;
            } else {
              await fetchImages(editId);
              setFormData(prev => ({ ...prev, zdjecia: [] }));
            }
          }
        }

        // Pokaż sukces TYLKO jeśli zdjęcia się udały lub ich nie było
        if (photoUploadSuccess) {
          setMessage({ type: 'success', text: role === 'User' ? 'Oferta zaktualizowana! Nowe zdjęcia dodane.' : 'Oferta zaktualizowana.' });
        }
        // Nie przekierowujemy od razu – użytkownik może dalej edytować zdjęcia
        return;
      }

      // Sprawdź duplikaty przed utworzeniem nowej oferty (pomijamy jeśli użytkownik już potwierdził)
      if (!skipDuplicateCheck) {
        const canContinue = await checkForDuplicates();
        if (!canContinue) {
          setLoading(false);
          return; // Użytkownik zobaczy modal z ostrzeżeniem
        }
      }

      // Reset flagi po użyciu
      setSkipDuplicateCheck(false);

      // Przygotuj dane do wysłania jako FormData
      const formDataToSend = new FormData();
      formDataToSend.append('tytul', formData.tytul.trim());
      formDataToSend.append('opis', formData.opis.trim());

      // Dla ofert za darmo, ustaw cenę na 0
      if (formData.zaDarmo) {
        formDataToSend.append('cena', '0');
      } else if (formData.cenaAktualna) {
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
          zdjecia: [],
          zaDarmo: false,
          waznoscOd: '',
          waznoscDo: ''
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
            {editId ? '✏️ Edytuj Okazję' : '🛍️ Nowa Okazja'}
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
                    Tytuł okazji *
                  </label>
                  <input
                    type="text"
                    name="tytul"
                    value={formData.tytul}
                    onChange={handleInputChange}
                    placeholder="np. Smartfon TechX Pro 128GB - 23% taniej w RTV Euro"
                    required
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {fieldErrors.tytul && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.tytul}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Krótko opisz produkt i promocję (max 150 znaków)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Opis *
                  </label>
                  <textarea
                    name="opis"
                    value={formData.opis}
                    onChange={handleInputChange}
                    placeholder="Opisz produkt, jego specyfikację, warunki promocji, dostępność..."
                    required
                    rows={5}
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {fieldErrors.opis && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.opis}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Szczegółowy opis produktu i warunków promocji (max 1000 znaków)</p>
                </div>
              </div>
            </div>

            {/* Ceny i sklep */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border dark:border-gray-700 transition-colors">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center transition-colors">
                <Tag className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Ceny i sklep
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
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
                        className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm transition-colors">PLN</span>
                    </div>
                    {fieldErrors.cenaPoprzednia && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.cenaPoprzednia}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Cena przed promocją</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Cena promocyjna {!formData.zaDarmo && '*'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="cenaAktualna"
                        value={formData.cenaAktualna}
                        onChange={handleInputChange}
                        placeholder={formData.zaDarmo ? "Za darmo" : "4599.99"}
                        required={!formData.zaDarmo}
                        step="0.01"
                        min="0"
                        disabled={formData.zaDarmo}
                        className={`w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-semibold ${formData.zaDarmo ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400 text-sm font-semibold transition-colors">PLN</span>
                    </div>
                    {fieldErrors.cenaAktualna && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.cenaAktualna}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      {formData.zaDarmo ? 'Oferta za darmo - cena nie jest wymagana' : 'Aktualna cena promocyjna'}
                    </p>
                  </div>
                </div>

                {/* Checkbox Za darmo */}
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 transition-colors">
                  <input
                    type="checkbox"
                    id="zaDarmo"
                    name="zaDarmo"
                    checked={formData.zaDarmo}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        zaDarmo: isChecked,
                        // Wyczyść cenę promocyjną jeśli zaznaczono "za darmo"
                        cenaAktualna: isChecked ? '' : prev.cenaAktualna
                      }));
                      // Wyczyść błędy walidacji
                      if (fieldErrors.cenaAktualna) {
                        setFieldErrors(prev => ({ ...prev, cenaAktualna: '' }));
                      }
                    }}
                    className="w-5 h-5 text-green-600 border-2 border-green-300 dark:border-green-600 rounded focus:ring-green-500 focus:ring-2 transition-colors"
                  />
                  <label htmlFor="zaDarmo" className="text-sm font-semibold text-green-700 dark:text-green-400 cursor-pointer flex items-center gap-1 transition-colors">
                    <Gift className="w-4 h-4" /> Ta oferta jest za darmo
                  </label>
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
                    placeholder="https://www.sklep.pl/produkt"
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                  {fieldErrors.sklep && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.sklep}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Pełny URL do oferty w sklepie</p>
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
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
                <Image className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
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
                    placeholder="np. apple, smartphone, promocja"
                    className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {fieldErrors.tagi && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400 transition-colors">{fieldErrors.tagi}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Słowa kluczowe oddzielone przecinkami</p>
                </div>

                {/* Ważność oferty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Data rozpoczęcia ważności</p>
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
                      className="w-full px-4 py-3 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">Data zakończenia ważności</p>
                  </div>
                </div>

                {/* Zdjęcia */}
                <div>
                  <label className="flex flex-col text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    <div className="flex items-center mb-1">
                      <Image className="w-4 h-4 mr-1" />
                      Zdjęcia oferty
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal transition-colors">Dodaj do 5 zdjęć (JPG, PNG, max 5MB każde)</span>
                  </label>

                  {/* Upload Area */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${isDragOver
                      ? 'border-purple-500 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
                      <label className="inline-flex items-center px-4 py-2 bg-purple-500 dark:bg-purple-600 text-white rounded-lg hover:bg-purple-600 dark:hover:bg-purple-500 transition-all cursor-pointer">
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
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 dark:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 dark:hover:bg-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg">
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
            <div className="flex justify-between items-center pt-6 border-t dark:border-gray-700 transition-colors">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
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
                    <Rocket className="w-5 h-5 inline mr-2" />
                    {editId ? 'Zapisz zmiany' : 'Opublikuj Okazję'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal ostrzeżenia o duplikatach */}
      {duplicateCheckResult && (
        <ModalOstrzezeniaDuplikatow
          isOpen={showDuplicateModal}
          onClose={() => {
            setShowDuplicateModal(false);
            setDuplicateCheckResult(null);
          }}
          onContinue={() => {
            setShowDuplicateModal(false);
            setSkipDuplicateCheck(true);
            // Automatycznie wyślij formularz ponownie
            setTimeout(() => {
              const form = document.querySelector('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
              }
            }, 100);
          }}
          duplicates={duplicateCheckResult.potencjalneDuplikaty || []}
          message={duplicateCheckResult.wiadomosc || 'Znaleziono podobne oferty w bazie danych.'}
        />
      )}
    </div>
  );
};

export default FormularzTworzeniaOkazji;
