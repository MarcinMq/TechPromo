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
            ✂️ Dodaj Kupon
          </h1>
          <p className="form-subtitle">
            Podziel się kodem rabatowym z innymi użytkownikami
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
              Tytuł kuponu *
              <span className="label-hint">Krótko opisz co obejmuje kupon</span>
            </label>
            <input
              type="text"
              name="tytul"
              value={formData.tytul}
              onChange={handleInputChange}
              placeholder="np. 20% zniżki na całą elektronikę w Media Markt"
              className="form-input"
              required
            />
          </div>

          {/* Kod rabatowy */}
          <div className="form-group">
            <label className="form-label">
              Kod rabatowy *
              <span className="label-hint">Kod do wpisania przy zakupie</span>
            </label>
            <div className="coupon-code-input">
              <input
                type="text"
                name="kodRabatowy"
                value={formData.kodRabatowy}
                onChange={handleInputChange}
                placeholder="np. TECH20, SAVE15, WELCOME"
                className="form-input coupon-code"
                required
              />
              {formData.kodRabatowy && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(formData.kodRabatowy)}
                  className="copy-code-btn"
                  title="Skopiuj kod"
                >
                  📋
                </button>
              )}
            </div>
          </div>

          {/* Wartość rabatu */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Wartość rabatu *
              </label>
              <div className="discount-input">
                <input
                  type="number"
                  name="wartoscRabatu"
                  value={formData.wartoscRabatu}
                  onChange={handleInputChange}
                  placeholder="20"
                  step="0.01"
                  className="form-input"
                  required
                />
                <select
                  name="typRabatu"
                  value={formData.typRabatu}
                  onChange={handleInputChange}
                  className="form-select discount-type"
                >
                  <option value="procent">%</option>
                  <option value="kwota">PLN</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Minimalna kwota zakupu
                <span className="label-hint">Opcjonalne</span>
              </label>
              <div className="price-input">
                <input
                  type="number"
                  name="minimalniaKwota"
                  value={formData.minimalniaKwota}
                  onChange={handleInputChange}
                  placeholder="100"
                  step="0.01"
                  className="form-input"
                />
                <span className="currency">PLN</span>
              </div>
            </div>
          </div>

          {/* Data ważności */}
          <div className="form-group">
            <label className="form-label">
              Data ważności
              <span className="label-hint">Do kiedy kupon jest aktywny</span>
            </label>
            <input
              type="date"
              name="dataWaznosci"
              value={formData.dataWaznosci}
              onChange={handleInputChange}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Opis */}
          <div className="form-group">
            <label className="form-label">
              Opis kuponu *
              <span className="label-hint">Opisz warunki użycia, ograniczenia</span>
            </label>
            <textarea
              name="opis"
              value={formData.opis}
              onChange={handleInputChange}
              placeholder="Opisz warunki użycia kuponu, na co można go wykorzystać, ewentualne ograniczenia..."
              className="form-textarea"
              rows={4}
              required
            />
          </div>

          {/* Sklep i kategoria */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Sklep *
                <span className="label-hint">Gdzie można użyć kuponu</span>
              </label>
              <input
                type="text"
                name="sklep"
                value={formData.sklep}
                onChange={handleInputChange}
                placeholder="np. Zalando, H&M, Allegro"
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
              Link do sklepu
              <span className="label-hint">Bezpośredni link gdzie użyć kupon</span>
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://example.com"
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
              placeholder="np. rabat, darmowa dostawa, kod promocyjny"
              className="form-input"
            />
          </div>

          {/* Zdjęcia */}
          <div className="form-group">
            <label className="form-label">
              Zdjęcia kuponu
              <span className="label-hint">Opcjonalne, maksymalnie 3 zdjęcia</span>
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

          {/* Podgląd kuponu */}
          {formData.kodRabatowy && (
            <div className="coupon-preview">
              <h3>Podgląd kuponu:</h3>
              <div className="coupon-card">
                <div className="coupon-header">
                  <span className="coupon-discount">
                    {formData.wartoscRabatu}{formData.typRabatu === 'procent' ? '%' : ' PLN'}
                  </span>
                  <span className="coupon-title">{formData.tytul || 'Tytuł kuponu'}</span>
                </div>
                <div className="coupon-code-display">
                  <span className="code-label">Kod:</span>
                  <span className="code-value">{formData.kodRabatowy}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.kodRabatowy)}
                    className="copy-btn-small"
                  >
                    📋
                  </button>
                </div>
                {formData.minimalniaKwota && (
                  <div className="coupon-condition">
                    Min. zakup: {formData.minimalniaKwota} PLN
                  </div>
                )}
                {formData.dataWaznosci && (
                  <div className="coupon-expiry">
                    Ważny do: {new Date(formData.dataWaznosci).toLocaleDateString('pl-PL')}
                  </div>
                )}
              </div>
            </div>
          )}

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
              {loading ? '⏳ Dodawanie...' : '🎫 Opublikuj Kupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCouponForm;
