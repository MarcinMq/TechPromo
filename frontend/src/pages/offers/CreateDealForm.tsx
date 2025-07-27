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
    <div className="page-container">
      <div className="form-container">
        <div className="form-header">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Powrót
          </button>
          <h1 className="form-title">
            🏷️ Dodaj Okazję
          </h1>
          <p className="form-subtitle">
            Podziel się świetną promocją z innymi użytkownikami
          </p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="offer-form">
          {/* Tytuł */}
          <div className="form-group">
            <label className="form-label">
              Tytuł okazji *
              <span className="label-hint">Krótko i konkretnie opisz promocję</span>
            </label>
            <input
              type="text"
              name="tytul"
              value={formData.tytul}
              onChange={handleInputChange}
              placeholder="np. iPhone 15 Pro 256GB - 40% taniej!"
              className="form-input"
              required
            />
          </div>

          {/* Opis */}
          <div className="form-group">
            <label className="form-label">
              Opis okazji *
              <span className="label-hint">Opisz szczegóły promocji, dlaczego warto</span>
            </label>
            <textarea
              name="opis"
              value={formData.opis}
              onChange={handleInputChange}
              placeholder="Opisz szczegóły promocji, warunki, czas trwania..."
              className="form-textarea"
              rows={4}
              required
            />
          </div>

          {/* Ceny */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Cena promocyjna *
                <span className="label-hint">Aktualna cena po rabacie</span>
              </label>
              <div className="price-input">
                <input
                  type="number"
                  name="cena"
                  value={formData.cena}
                  onChange={handleInputChange}
                  placeholder="999.99"
                  step="0.01"
                  className="form-input"
                  required
                />
                <span className="currency">PLN</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Cena regularna
                <span className="label-hint">Cena przed promocją</span>
              </label>
              <div className="price-input">
                <input
                  type="number"
                  name="cenaPoprzednia"
                  value={formData.cenaPoprzednia}
                  onChange={handleInputChange}
                  placeholder="1499.99"
                  step="0.01"
                  className="form-input"
                />
                <span className="currency">PLN</span>
              </div>
            </div>
          </div>

          {/* Sklep i kategoria */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Sklep *
                <span className="label-hint">Gdzie dostępna jest promocja</span>
              </label>
              <input
                type="text"
                name="sklep"
                value={formData.sklep}
                onChange={handleInputChange}
                placeholder="np. Media Markt, x-kom, Amazon"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Kategoria *
              </label>
              <select
                name="kategoria"
                value={formData.kategoria}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Link */}
          <div className="form-group">
            <label className="form-label">
              Link do oferty
              <span className="label-hint">Bezpośredni link do produktu</span>
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://example.com/produkt"
              className="form-input"
            />
          </div>

          {/* Tagi */}
          <div className="form-group">
            <label className="form-label">
              Tagi
              <span className="label-hint">Słowa kluczowe oddzielone przecinkami</span>
            </label>
            <input
              type="text"
              name="tagi"
              value={formData.tagi}
              onChange={handleInputChange}
              placeholder="np. apple, smartphone, promocja, black friday"
              className="form-input"
            />
          </div>

          {/* Zdjęcia */}
          <div className="form-group">
            <label className="form-label">
              Zdjęcia produktu
              <span className="label-hint">Maksymalnie 5 zdjęć</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="file-input"
            />
            
            {imagePreview.length > 0 && (
              <div className="image-preview-grid">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Podgląd ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Przyciski */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '⏳ Dodawanie...' : '🚀 Opublikuj Okazję'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDealForm;
