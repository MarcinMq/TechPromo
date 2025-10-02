import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, Tag, Store, Upload, Image, X, ShoppingBag, Camera, FileText } from 'lucide-react';
import { getAuthToken, getUserData } from '../../utils/auth';
import FormStepper from '../../components/FormStepper';
import FormSection from '../../components/FormSection';
import FormField from '../../components/FormField';

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

const CreateCouponForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: 'Podstawowe', description: 'Tytuł i opis' },
    { id: 2, title: 'Szczegóły', description: 'Kod i ceny' },
    { id: 3, title: 'Dodatkowe', description: 'Zdjęcia i tagi' }
  ];
  
  const [formData, setFormData] = useState<CouponFormData>({
    tytul: '',
    opis: '',
    cenaAktualna: '',
    cenaPoprzednia: '',
    kod: '',
    kategoria: 'Telefony',
    sklep: '', // przechowuje URL
    tagi: '',
    typ: 'kupon',
    zdjecia: [],
    bezMinimalnejKwoty: false
  });

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
              kod: data.kod || data.Kod || '',
              kategoria: data.kategoria || data.Kategoria || 'Telefony',
              sklep: data.sklep || data.Sklep || '',
              tagi: (data.tagi || data.Tagi || []).join(', '),
              typ: 'kupon'
            }));
          })
          .catch(() => {
            setMessage({ type: 'error', text: 'Brak uprawnień do edycji tego kuponu' });
            setTimeout(()=> navigate('/konto/profil'), 1500);
          });
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Auto-advance steps based on field completion
    validateAndAdvanceStep(name, value);
  };

  const validateAndAdvanceStep = (fieldName: string, value: string) => {
    const step1Fields = ['tytul', 'opis'];
    const step2Fields = ['kod', 'cenaAktualna', 'kategoria'];
    
    if (step1Fields.includes(fieldName) && currentStep === 1) {
      // Stwórz zaktualizowane dane z nową wartością
      const updatedData = { ...formData, [fieldName]: value };
      const step1Complete = updatedData.tytul.trim() && updatedData.opis.trim();
      if (step1Complete && !completedSteps.includes(1)) {
        setCompletedSteps(prev => [...prev, 1]);
      }
    }
    
    if (step2Fields.includes(fieldName) && currentStep <= 2) {
      // Stwórz zaktualizowane dane z nową wartością
      const updatedData = { ...formData, [fieldName]: value };
      const step2Complete = updatedData.kod.trim() && (formData.bezMinimalnejKwoty || updatedData.cenaAktualna) && updatedData.kategoria;
      if (step2Complete && !completedSteps.includes(2)) {
        setCompletedSteps(prev => [...prev, 2]);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.tytul.trim()) errors.tytul = 'Tytuł jest wymagany';
        if (formData.tytul.length > 150) errors.tytul = 'Tytuł nie może być dłuższy niż 150 znaków';
        if (!formData.opis.trim()) errors.opis = 'Opis jest wymagany';
        if (formData.opis.length > 1000) errors.opis = 'Opis nie może być dłuższy niż 1000 znaków';
        break;
      case 2:
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
        if (formData.sklep && !formData.sklep.match(/^https?:\/\/.+/)) {
          errors.sklep = 'Link musi zaczynać się od http:// lub https://';
        }
        break;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
      if (!formData.kod.trim()) {
        throw new Error('Kod promocyjny jest wymagany dla kuponów');
      }
      if (!formData.kategoria) {
        throw new Error('Kategoria jest wymagana');
      }

      const token = getAuthToken();
      if (!token) throw new Error('Brak tokenu uwierzytelniającego. Zaloguj się ponownie.');

      if (editId) {
        const payload = {
          tytul: formData.tytul.trim(),
          opis: formData.opis.trim(),
          cena: formData.cenaAktualna ? parseFloat(formData.cenaAktualna) : null,
          cenaPoprzednia: formData.cenaPoprzednia ? parseFloat(formData.cenaPoprzednia) : null,
          kod: formData.kod.trim(),
          // Wysyłamy pusty string jeśli pole puste, aby można było wyczyścić link
          link: formData.sklep !== undefined ? formData.sklep.trim() : ''
        };
        const role = getUserData()?.role;
        const putUrl = (role === 'Admin' || role === 'Moderator')
          ? `/api/admin/oferta/${editId}`
          : `/api/uzytkownik/oferta/${editId}`;
        const res = await fetch(putUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Nie udało się zaktualizować kuponu');
        setMessage({ type: 'success', text: role === 'User' ? 'Kupon zaktualizowany – oczekuje ponownej moderacji.' : 'Kupon zaktualizowany.' });
  setTimeout(() => navigate(role === 'User' ? '/konto/profil' : '/'), 1500);
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
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
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

      console.log('Wysyłanie danych (kupon)');

      // Wyślij jako FormData z prawidłowym tokenem
      const response = await fetch('/api/oferta/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
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
          bezMinimalnejKwoty: false
        });

        // Przekierowanie po 3 sekundach
        setTimeout(() => {
          navigate('/konto/profil');
        }, 3000);
      } else {
        const errorData = await response.text();
        throw new Error(`Błąd (${response.status}): ${errorData || 'Nie udało się dodać kuponu'}`);
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

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">
            {editId ? '✏️ Edytuj Kupon' : '🎫 Nowy Kupon'}
          </h1>

          {/* Progress Stepper */}
          <FormStepper 
            steps={steps} 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
          />

          {message && (
            <div className={`p-4 rounded-2xl mb-6 text-center font-semibold backdrop-blur-sm ${
              message.type === 'success' 
                ? 'bg-green-100/80 text-green-700 border border-green-200/50' 
                : 'bg-red-100/80 text-red-700 border border-red-200/50'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Podstawowe informacje */}
            {currentStep === 1 && (
              <FormSection 
                title="Podstawowe informacje" 
                description="Główne dane o kuponie"
                icon={FileText}
              >
                <FormField
                  label="Tytuł kuponu"
                  name="tytul"
                  value={formData.tytul}
                  onChange={handleInputChange}
                  placeholder="np. 20% zniżki na wszystkie smartwatche w Media Expert"
                  required
                  error={fieldErrors.tytul}
                  helperText="Krótko opisz promocję (max 150 znaków)"
                  icon={Ticket}
                />
                
                <FormField
                  label="Opis kuponu"
                  name="opis"
                  type="textarea"
                  value={formData.opis}
                  onChange={handleInputChange}
                  placeholder="Opisz warunki użycia kuponu, czas ważności, minimalne kwoty zakupu..."
                  required
                  error={fieldErrors.opis}
                  helperText="Szczegółowy opis promocji i warunków (max 1000 znaków)"
                  rows={5}
                />
              </FormSection>
            )}

            {/* Step 2: Kod i ceny */}
            {currentStep === 2 && (
              <FormSection 
                title="Szczegóły kuponu" 
                description="Kod promocyjny, kwoty i kategoria"
                icon={ShoppingBag}
              >
                <FormField
                  label="Kod promocyjny"
                  name="kod"
                  value={formData.kod}
                  onChange={handleInputChange}
                  placeholder="np. SAVE20, SUPER30"
                  required
                  error={fieldErrors.kod}
                  helperText="Kod, który trzeba wpisać aby aktywować kupon (max 50 znaków)"
                  icon={Tag}
                  className="font-mono text-lg font-bold text-purple-700"
                />

                {/* Checkbox dla kuponów bez minimalnej kwoty */}
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
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
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="bezMinimalnejKwoty" className="text-sm font-medium text-purple-700 cursor-pointer">
                    🎯 Kupon bez minimalnej kwoty (np. darmowa dostawa, kupony procentowe)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Minimalna kwota poprzednia"
                    name="cenaPoprzednia"
                    type="number"
                    value={formData.cenaPoprzednia}
                    onChange={handleInputChange}
                    placeholder="299.00"
                    error={fieldErrors.cenaPoprzednia}
                    helperText={formData.bezMinimalnejKwoty ? 
                      "Pole wyłączone - kupon bez minimalnej kwoty" : 
                      "Minimalna kwota przed zastosowaniem kuponu"
                    }
                    prefix="PLN"
                    step="0.01"
                    min="0"
                    disabled={formData.bezMinimalnejKwoty}
                  />
                  
                  <FormField
                    label="Minimalna kwota z kuponem"
                    name="cenaAktualna"
                    type="number"
                    value={formData.cenaAktualna}
                    onChange={handleInputChange}
                    placeholder="199.00"
                    required={!formData.bezMinimalnejKwoty}
                    error={fieldErrors.cenaAktualna}
                    helperText={formData.bezMinimalnejKwoty ? 
                      "Pole wyłączone - kupon bez minimalnej kwoty" : 
                      "Minimalna kwota po zastosowaniu kuponu"
                    }
                    prefix="PLN"
                    step="0.01"
                    min="0"
                    className="text-red-600 font-semibold"
                    disabled={formData.bezMinimalnejKwoty}
                  />
                </div>

                <FormField
                  label="Link do oferty / sklepu"
                  name="sklep"
                  value={formData.sklep}
                  onChange={handleInputChange}
                  placeholder="https://www.sklep.pl/promocja"
                  error={fieldErrors.sklep}
                  helperText="Pełny URL strony gdzie można użyć kuponu"
                  icon={Store}
                />

                {/* Kategoria */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Kategoria *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {categories.map(category => (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, kategoria: category.name }));
                          validateAndAdvanceStep('kategoria', category.name);
                        }}
                        className={`p-3 rounded-xl border transition-all text-center hover:scale-105 ${
                          formData.kategoria === category.name
                            ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-md ring-2 ring-purple-200'
                            : 'bg-white/90 border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{category.icon}</div>
                        <div className="text-xs font-medium">{category.name}</div>
                      </button>
                    ))}
                  </div>
                  {fieldErrors.kategoria && (
                    <p className="mt-2 text-sm text-red-500">{fieldErrors.kategoria}</p>
                  )}
                </div>
              </FormSection>
            )}

            {/* Step 3: Zdjęcia i tagi */}
            {currentStep === 3 && (
              <FormSection 
                title="Dodatkowe informacje" 
                description="Zdjęcia i tagi"
                icon={Camera}
              >
                <FormField
                  label="Tagi"
                  name="tagi"
                  value={formData.tagi}
                  onChange={handleInputChange}
                  placeholder="np. zniżka, promocja, kupon, blackfriday"
                  error={fieldErrors.tagi}
                  helperText="Słowa kluczowe oddzielone przecinkami"
                  icon={Tag}
                />

                {/* Zdjęcia */}
                <div>
                  <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center mb-1">
                      <Image className="w-4 h-4 mr-1" />
                      Zdjęcia kuponu
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
                      <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all cursor-pointer">
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
              </FormSection>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    ← Poprzedni
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Anuluj
                </button>
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all"
                  >
                    Dalej →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCouponForm;
