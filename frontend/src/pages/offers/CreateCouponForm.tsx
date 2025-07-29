import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../utils/api';

interface CouponFormData {
  tytul: string;
  opis: string;
  kodRabatowy: string;
  wartoscRabatu: string;
  typRabatu: 'procent' | 'kwota';
  minimalniaKwota: string;
  sklep: string;
  kategoria: string;
  tagi: string;
  link: string;
  dataWaznosci: string;
}

const CreateCouponForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<CouponFormData>({
    tytul: '',
    opis: '',
    kodRabatowy: '',
    wartoscRabatu: '',
    typRabatu: 'procent',
    minimalniaKwota: '',
    sklep: '',
    kategoria: 'Elektronika',
    tagi: '',
    link: '',
    dataWaznosci: ''
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const categories = [
    'Elektronika', 'Moda', 'Dom i Ogród', 'Sport', 'Książki', 
    'Gry', 'Kosmetyki', 'Jedzenie', 'Podróże', 'Inne'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 3) {
      setMessage({ type: 'error', text: 'Możesz dodać maksymalnie 3 zdjęcia dla kuponu' });
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Kod skopiowany do schowka!' });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const submitData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value);
      });

      submitData.append('typ', 'kupon');
      
      selectedImages.forEach((file, index) => {
        submitData.append(`zdjecie_${index}`, file);
      });

      const response = await apiPost('/kupon', submitData);
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Kupon został dodany pomyślnie!' });
        setTimeout(() => {
          navigate('/user/panel');
        }, 2000);
      } else {
        throw new Error('Błąd podczas dodawania kuponu');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Wystąpił błąd podczas dodawania kuponu' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">✂️ Nowy Kupon</h1>

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
                <span className="block text-xs text-gray-500 mt-1">Krótko opisz co obejmuje kupon</span>
              </label>
              <input
                type="text"
                name="tytul"
                value={formData.tytul}
                onChange={handleInputChange}
                placeholder="np. 20% zniżki na całą elektronikę w Media Markt"
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Kod rabatowy */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kod rabatowy *
                <span className="block text-xs text-gray-500 mt-1">Kod do wpisania przy zakupie</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="kodRabatowy"
                  value={formData.kodRabatowy}
                  onChange={handleInputChange}
                  placeholder="np. TECH20, SAVE15, WELCOME"
                  className="flex-1 p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  required
                />
                {formData.kodRabatowy && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.kodRabatowy)}
                    className="p-4 bg-custom-blue/80 backdrop-blur-sm text-white rounded-2xl hover:bg-custom-blue/90 transition-all"
                    title="Skopiuj kod"
                  >
                    📋
                  </button>
                )}
              </div>
            </div>

            {/* Wartość rabatu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wartość rabatu *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="wartoscRabatu"
                    value={formData.wartoscRabatu}
                    onChange={handleInputChange}
                    placeholder="20"
                    step="0.01"
                    className="flex-1 p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                    required
                  />
                  <select
                    name="typRabatu"
                    value={formData.typRabatu}
                    onChange={handleInputChange}
                    className="p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  >
                    <option value="procent">%</option>
                    <option value="kwota">PLN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimalna kwota zakupu
                  <span className="block text-xs text-gray-500 mt-1">Opcjonalne</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="minimalniaKwota"
                    value={formData.minimalniaKwota}
                    onChange={handleInputChange}
                    placeholder="100"
                    step="0.01"
                    className="flex-1 p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  />
                  <span className="p-4 bg-gray-100/80 backdrop-blur-sm text-gray-700 rounded-2xl border border-gray-200/50 flex items-center">PLN</span>
                </div>
              </div>
            </div>

            {/* Data ważności */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data ważności
                <span className="block text-xs text-gray-500 mt-1">Do kiedy kupon jest aktywny</span>
              </label>
              <input
                type="date"
                name="dataWaznosci"
                value={formData.dataWaznosci}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Opis */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Opis kuponu *
                <span className="block text-xs text-gray-500 mt-1">Opisz warunki użycia, ograniczenia</span>
              </label>
              <textarea
                name="opis"
                value={formData.opis}
                onChange={handleInputChange}
                placeholder="Opisz warunki użycia kuponu, na co można go wykorzystać, ewentualne ograniczenia..."
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all resize-none"
                rows={4}
                required
              />
            </div>

            {/* Sklep i kategoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sklep *
                  <span className="block text-xs text-gray-500 mt-1">Gdzie można użyć kuponu</span>
                </label>
                <input
                  type="text"
                  name="sklep"
                  value={formData.sklep}
                  onChange={handleInputChange}
                  placeholder="np. Zalando, H&M, Allegro"
                  className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategoria *
                </label>
                <select
                  name="kategoria"
                  value={formData.kategoria}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Link do sklepu
                <span className="block text-xs text-gray-500 mt-1">Bezpośredni link gdzie użyć kupon</span>
              </label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
              />
            </div>

            {/* Tagi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tagi
                <span className="block text-xs text-gray-500 mt-1">Słowa kluczowe oddzielone przecinkami</span>
              </label>
              <input
                type="text"
                name="tagi"
                value={formData.tagi}
                onChange={handleInputChange}
                placeholder="np. rabat, darmowa dostawa, kod promocyjny"
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
              />
            </div>

            {/* Zdjęcia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zdjęcia kuponu
                <span className="block text-xs text-gray-500 mt-1">Opcjonalne, maksymalnie 3 zdjęcia</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all file:p-4 file:border-0 file:bg-custom-blue file:text-white file:rounded-full file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:text-sm file:font-semibold file:bg-custom-blue-dark hover:bg-custom-blue-darker"
              />
              
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative rounded-2xl overflow-hidden border border-gray-200/50">
                      <img src={preview} alt={`Podgląd ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500/80 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Podgląd kuponu */}
            {formData.kodRabatowy && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Podgląd kuponu:</h3>
                <div className="bg-gradient-to-r from-custom-blue/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-custom-blue/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-custom-blue">
                      {formData.wartoscRabatu}{formData.typRabatu === 'procent' ? '%' : ' PLN'}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{formData.tytul || 'Tytuł kuponu'}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-sm text-gray-600">Kod:</span>
                    <span className="text-lg font-mono font-bold text-gray-900">{formData.kodRabatowy}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.kodRabatowy)}
                      className="p-2 bg-custom-blue/80 backdrop-blur-sm text-white rounded-full hover:bg-custom-blue/90 transition-all"
                    >
                      📋
                    </button>
                  </div>
                  {formData.minimalniaKwota && (
                    <div className="text-sm text-gray-600 mb-2">
                      Min. zakup: {formData.minimalniaKwota} PLN
                    </div>
                  )}
                  {formData.dataWaznosci && (
                    <div className="text-sm text-gray-600">
                      Ważny do: {new Date(formData.dataWaznosci).toLocaleDateString('pl-PL')}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                {loading ? '⏳ Dodawanie...' : '🎫 Opublikuj Kupon'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCouponForm;
