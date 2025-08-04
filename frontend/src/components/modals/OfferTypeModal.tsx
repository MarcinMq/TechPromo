import React from 'react';
import { useNavigate } from 'react-router-dom';

interface OfferTypeModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const OfferTypeModal: React.FC<OfferTypeModalProps> = ({ isVisible, onClose }) => {
  const navigate = useNavigate();

  const handleOfferTypeSelect = (type: 'okazja' | 'kupon') => {
    onClose();
    if (type === 'okazja') {
      navigate('/stworz-oferte/okazja');
    } else {
      navigate('/stworz-oferte/kupon');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 w-96 max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Co chcesz opublikować?</h2>

        <div className="flex flex-col space-y-4 mb-6">
          <div 
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 cursor-pointer transition-all hover:shadow-xl hover:scale-105 flex flex-col justify-between h-full"
            onClick={() => handleOfferTypeSelect('okazja')}
          >
            <span className="text-4xl mb-4">🏷️</span>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Okazja</h3>
            <p className="text-gray-700 mb-4 text-sm">
              Publikuj przeważnie promocyjne produkty, takie jak telefon, para adidas (z kuponem lub bez).
            </p>
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
              <li>Produkty w promocji</li>
              <li>Zniżki cenowe</li>
              <li>Ograniczone czasowo</li>
              <li>Konkretne produkty</li>
            </ul>
          </div>

          <div 
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 cursor-pointer transition-all hover:shadow-xl hover:scale-105 flex flex-col justify-between h-full"
            onClick={() => handleOfferTypeSelect('kupon')}
          >
            <span className="text-4xl mb-4">✂️</span>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Kupon</h3>
            <p className="text-gray-700 mb-4 text-sm">
              Zamieszczaj kupony i kody rabatowe dające zniżki na różne produkty czy zakupy w sklepach.
            </p>
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
              <li>Kody rabatowe</li>
              <li>Kupony zniżkowe</li>
              <li>Darmowa dostawa</li>
              <li>Rabaty procentowe</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all text-gray-700 font-semibold border border-white/30"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferTypeModal;
