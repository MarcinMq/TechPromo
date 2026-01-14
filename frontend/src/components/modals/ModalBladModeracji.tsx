import React from 'react';
import { ShieldX, X } from 'lucide-react';

interface Props {
    isVisible: boolean;
    message: string;
    onClose: () => void;
}

/**
 * Modal wyświetlający informację o odrzuceniu treści przez Azure Content Safety.
 * Pojawia się gdy opis/zdjęcia oferty zawierają nieodpowiednie treści.
 */
const ModalBladModeracji: React.FC<Props> = ({ isVisible, message, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Tło */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Okno modalne */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                {/* Przycisk zamknięcia */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Ikona ostrzeżenia */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                {/* Nagłówek */}
                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Treść została zablokowana
                </h3>

                {/* Opis */}
                <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                    Automatyczna moderacja AI wykryła nieodpowiednie treści w Twojej publikacji.
                </p>

                {/* Szczegóły błędu */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-700 dark:text-red-300 text-center">
                        {message || 'Opis lub zdjęcia zawierają treści niezgodne z regulaminem.'}
                    </p>
                </div>

                {/* Wskazówki */}
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <p className="font-semibold mb-2">Co możesz zrobić:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Usuń wulgarne słowa z opisu</li>
                        <li>Zamień nieodpowiednie zdjęcia</li>
                        <li>Spróbuj ponownie dodać ofertę</li>
                    </ul>
                </div>

                {/* Przycisk */}
                <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    Rozumiem, poprawię treść
                </button>
            </div>
        </div>
    );
};

export default ModalBladModeracji;
