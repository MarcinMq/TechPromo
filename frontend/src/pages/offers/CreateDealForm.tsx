import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../utils/api';

interface DealFormData {
  tytul: string;
  opis: string;
  cena: string;
  cenaPoprzednia: string;
  sklep: string;
  kategoria: string;
  tagi: string;
  link: string;
}

const CreateDealForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<DealFormData>({
    tytul: '',
    opis: '',
    cena: '',
    cenaPoprzednia: '',
    sklep: '',
    kategoria: 'Elektronika',
    tagi: '',
    link: ''
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
    if (files.length + selectedImages.length > 5) {
      setMessage({ type: 'error', text: 'Możesz dodać maksymalnie 5 zdjęć' });
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    
    // Podgląd zdjęć
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const submitData = new FormData();
      
      // Dodaj dane tekstowe
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value);
      });

      // Dodaj typ oferty
      submitData.append('typ', 'okazja');
      
      // Dodaj zdjęcia
      selectedImages.forEach((file, index) => {
        submitData.append(`zdjecie_${index}`, file);
      });

      const response = await apiPost('/oferta', submitData);
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Okazja została dodana pomyślnie!' });
        setTimeout(() => {
          navigate('/user/panel');
        }, 2000);
      } else {
        throw new Error('Błąd podczas dodawania okazji');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Wystąpił błąd podczas dodawania okazji' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">🛍️ Nowa Okazja</h1>

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
                Tytuł okazji *
                <span className="block text-xs text-gray-500 mt-1">Krótko opisz produkt i promocję</span>
              </label>
              <input
                type="text"
                name="tytul"
                value={formData.tytul}
                onChange={handleInputChange}
                placeholder="np. iPhone 15 Pro 128GB - 23% taniej w Media Expert"
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Opis */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Opis *
                <span className="block text-xs text-gray-500 mt-1">Szczegółowy opis produktu i warunków promocji</span>
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

            {/* Ceny */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cena promocyjna *
                </label>
                <input
                  type="number"
                  name="cena"
                  value={formData.cena}
                  onChange={handleInputChange}
                  placeholder="4599"
                  step="0.01"
                  className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cena przed promocją
                </label>
                <input
                  type="number"
                  name="cenaPoprzednia"
                  value={formData.cenaPoprzednia}
                  onChange={handleInputChange}
                  placeholder="5999"
                  step="0.01"
                  className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Sklep i kategoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sklep *
                </label>
                <input
                  type="text"
                  name="sklep"
                  value={formData.sklep}
                  onChange={handleInputChange}
                  placeholder="np. Media Expert, x-kom, RTV Euro AGD"
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
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Link do oferty
                <span className="block text-xs text-gray-500 mt-1">Bezpośredni link do produktu</span>
              </label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                placeholder="https://example.com/produkt"
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
                placeholder="np. apple, smartphone, promocja, black friday"
                className="w-full p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-custom-blue focus:border-transparent transition-all"
              />
            </div>

            {/* Zdjęcia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zdjęcia produktu
                <span className="block text-xs text-gray-500 mt-1">Maksymalnie 5 zdjęć</span>
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
                {loading ? '⏳ Dodawanie...' : '🚀 Opublikuj Okazję'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDealForm;
