import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, Tag, Store, DollarSign, Upload, Image, X } from 'lucide-react';

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
  
  const [formData, setFormData] = useState<CouponFormData>({
    tytul: '',
    opis: '',
    cenaAktualna: '',
    cenaPoprzednia: '',
    kod: '',
    kategoria: 'Telefony',
    sklep: '',
    tagi: '',
    typ: 'kupon',
    zdjecia: []
  });

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
      if (!formData.kod.trim()) {
        throw new Error('Kod promocyjny jest wymagany dla kuponów');
      }
      if (!formData.kategoria) {
        throw new Error('Kategoria jest wymagana');
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
        formDataToSend.append('sklep', formData.sklep.trim());
      }
      if (formData.tagi.trim()) {
        formDataToSend.append('tagi', formData.tagi.trim());
      }
      formDataToSend.append('typ', formData.typ);

      // Dodaj pliki zdjęć
      formData.zdjecia.forEach((file) => {
        formDataToSend.append('zdjecia', file);
      });

      console.log('Wysyłanie danych kuponu:', formDataToSend);

      // Wyślij jako FormData
      const token = localStorage.getItem('token');
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
          zdjecia: []
        });

        // Przekierowanie po 3 sekundach
        setTimeout(() => {
          navigate('/uzytkownik/panel');
        }, 3000);
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Błąd podczas dodawania kuponu');
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
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">🎫 Nowy Kupon</h1>

          {message && (
            <div className={`p-4 rounded-2xl mb-6 text-center font-semibold backdrop-blur-sm ${
              message.type === 'success' 
                ? 'bg-green-100/80 text-green-700 border border-green-200/50' 
                : 'bg-red-100/80 text-red-700 border border-red-200/50'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tytuł */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tytuł kuponu *
                <span className="block text-xs text-gray-500 mt-1">Krótko opisz promocję</span>
              </label>
              <input
                type="text"
                name="tytul"
                value={formData.tytul}
                onChange={handleInputChange}
                placeholder="np. 20% zniżki na wszystkie smartwatche w Media Expert"
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Opis */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Opis kuponu *
                <span className="block text-xs text-gray-500 mt-1">Szczegółowy opis promocji i warunków</span>
              </label>
              <textarea
                name="opis"
                value={formData.opis}
                onChange={handleInputChange}
                placeholder="Opisz warunki użycia kuponu, czas ważności, minimalne kwoty zakupu..."
                rows={4}
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                required
              />
            </div>

            {/* Ceny kuponu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center mb-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Minimalna kwota poprzednia
                  </div>
                  <span className="text-xs text-gray-500 font-normal">Minimalna kwota przed zastosowaniem kuponu</span>
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
                    className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center mb-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Minimalna kwota z kuponem
                  </div>
                  <span className="text-xs text-gray-500 font-normal">Minimalna kwota po zastosowaniu kuponu</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="cenaAktualna"
                    value={formData.cenaAktualna}
                    onChange={handleInputChange}
                    placeholder="199.00"
                    step="0.01"
                    min="0"
                    className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-red-600 font-semibold"
                  />
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-400" />
                </div>
              </div>
            </div>

            {/* Kod promocyjny */}
            <div>
              <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center mb-1">
                  <Tag className="w-4 h-4 mr-1" />
                  Kod promocyjny *
                </div>
                <span className="text-xs text-gray-500 font-normal">Kod, który trzeba wpisać aby aktywować kupon</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="kod"
                  value={formData.kod}
                  onChange={handleInputChange}
                  placeholder="np. SAVE20, SUPER30"
                  className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono text-lg font-bold text-purple-700"
                  required
                />
                <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              </div>
            </div>

            {/* Sklep */}
            <div>
              <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center mb-1">
                  <Store className="w-4 h-4 mr-1" />
                  Sklep
                </div>
                <span className="text-xs text-gray-500 font-normal">W którym sklepie obowiązuje kupon</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="sklep"
                  value={formData.sklep}
                  onChange={handleInputChange}
                  placeholder="np. Media Expert, x-kom, RTV Euro AGD"
                  className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <Store className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Wybór kategorii */}
            <div>
              <label className="flex flex-col text-sm font-semibold text-gray-700 mb-4">
                <span>Kategoria *</span>
                <span className="text-xs text-gray-500 font-normal">Wybierz kategorię produktów dla kuponu</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    onClick={() => setFormData(prev => ({ ...prev, kategoria: category.name }))}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-105 ${
                      formData.kategoria === category.name
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-gray-200 bg-white/80 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{category.name}</div>
                    </div>
                  </div>
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
                  placeholder="np. zniżka, promocja, kupon, blackfriday"
                  className="w-full p-4 pl-12 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

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

            {/* Przyciski */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-700 hover:bg-gray-100"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto p-4 border border-transparent rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin inline mr-2" />
                    Dodawanie...
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5 inline mr-2" />
                    Dodaj kupon
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

export default CreateCouponForm;
