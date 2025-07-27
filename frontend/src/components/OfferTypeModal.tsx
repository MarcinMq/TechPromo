import React from 'react';
import { useNavigate } from 'react-router-dom';

interface OfferTypeModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const OfferTypeModal: React.FC<OfferTypeModalProps> = ({ isVisible, onClose }) => {
  const navigate = useNavigate();

  const handleOfferTypeSelect = (type: 'deal' | 'coupon') => {
    onClose();
    if (type === 'deal') {
      navigate('/create-offer/deal');
    } else {
      navigate('/create-offer/coupon');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="offer-type-modal">
      <div className="offer-type-overlay" onClick={onClose} />
      <div className="offer-type-content">
        <div className="offer-type-header">
          <h2 className="offer-type-title">Co chcesz opublikować?</h2>
          <p className="offer-type-subtitle">Wybierz typ oferty, którą chcesz dodać</p>
        </div>

        <div className="offer-types-grid">
          {/* Oferta/Okazja */}
          <div 
            className="offer-type-option deal"
            onClick={() => handleOfferTypeSelect('deal')}
          >
            <span className="offer-type-icon">🏷️</span>
            <h3 className="offer-type-name">Okazja</h3>
            <p className="offer-type-description">
              Publikuj przeważnie promocyjne produkty, takie jak telefon, para adidas (z kuponem lub bez).
            </p>
            <ul className="offer-type-features">
              <li>Produkty w promocji</li>
              <li>Zniżki cenowe</li>
              <li>Ograniczone czasowo</li>
              <li>Konkretne produkty</li>
            </ul>
          </div>

          {/* Kupon */}
          <div 
            className="offer-type-option coupon"
            onClick={() => handleOfferTypeSelect('coupon')}
          >
            <span className="offer-type-icon">✂️</span>
            <h3 className="offer-type-name">Kupon</h3>
            <p className="offer-type-description">
              Zamieszczaj kupony i kody rabatowe dające zniżki na różne produkty czy zakupy w sklepach.
            </p>
            <ul className="offer-type-features">
              <li>Kody rabatowe</li>
              <li>Kupony zniżkowe</li>
              <li>Darmowa dostawa</li>
              <li>Rabaty procentowe</li>
            </ul>
          </div>
        </div>

        <button className="offer-type-close" onClick={onClose}>
          ✕ Zamknij
        </button>
      </div>
    </div>
  );
};

export default OfferTypeModal;
