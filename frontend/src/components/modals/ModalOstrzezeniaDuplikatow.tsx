import React from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

interface DopasowanieDuplikatu {
  ofertaId: number;
  tytul: string;
  linkDoOferty: string | null;
  sklep: string | null;
  cena: number | null;
  dataDodania: string;
  autor: string;
  wynikPodobienstwa: number;
  powodDopasowania: string;
}

interface ModalOstrzezeniaDuplikatowProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  duplicates: DopasowanieDuplikatu[];
  message: string;
}

const ModalOstrzezeniaDuplikatow: React.FC<ModalOstrzezeniaDuplikatowProps> = ({
  isOpen,
  onClose,
  onContinue,
  duplicates,
  message
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'Brak ceny';
    if (price === 0) return 'Za darmo';
    return `${price.toFixed(2)} zł`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden transition-colors">
        {/* Header */}
        <div className="bg-orange-500 dark:bg-orange-600 text-white p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Wykryto podobne oferty</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-600 dark:hover:bg-orange-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Warning Message */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6 transition-colors">
            <p className="text-orange-800 dark:text-orange-300 font-medium transition-colors">
              {message}
            </p>
          </div>

          {/* Duplicate List */}
          <div className="space-y-4">
            {duplicates.map((duplicate) => (
              <div
                key={duplicate.ofertaId}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 transition-colors">
                      {duplicate.tytul}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                      <span>Dodana: {formatDate(duplicate.dataDodania)}</span>
                      <span>•</span>
                      <span>Autor: {duplicate.autor}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 px-3 py-1 rounded-full text-sm font-semibold transition-colors">
                      {Math.round(duplicate.wynikPodobienstwa * 100)}% podobne
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  {duplicate.sklep && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 transition-colors">Sklep:</span>
                      <p className="text-gray-900 dark:text-gray-100 font-medium transition-colors">{duplicate.sklep}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 transition-colors">Cena:</span>
                    <p className="text-gray-900 dark:text-gray-100 font-medium transition-colors">{formatPrice(duplicate.cena)}</p>
                  </div>
                </div>

                {duplicate.powodDopasowania && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 transition-colors">
                    <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors">
                      <span className="font-semibold">Powód dopasowania:</span> {duplicate.powodDopasowania}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex space-x-2">
                  <a
                    href={`/okazja/${duplicate.ofertaId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <span>Zobacz ofertę</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {duplicate.linkDoOferty && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600 transition-colors">•</span>
                      <a
                        href={duplicate.linkDoOferty}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <span>Link zewnętrzny</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-600 transition-colors">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-orange-500 dark:bg-orange-600 text-white rounded-lg hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors font-medium"
          >
            Dodaj mimo to
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalOstrzezeniaDuplikatow;
