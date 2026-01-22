import React from 'react';
import { Award, Flame, MessageCircle, ThumbsUp, Image, Gift, Trophy } from 'lucide-react';

interface BadgeRule {
    icon: React.ReactNode;
    name: string;
    code: string;
    description: string;
    requirement: string;
    points: number;
}

const badgeRules: BadgeRule[] = [
    {
        icon: <Gift className="w-8 h-8 text-green-500" />,
        name: "Pierwsza okazja",
        code: "first_deal",
        description: "Nagroda za dodanie pierwszej oferty do serwisu",
        requirement: "Dodaj swoją pierwszą okazję lub kupon",
        points: 50
    },
    {
        icon: <Trophy className="w-8 h-8 text-yellow-500" />,
        name: "5 okazji",
        code: "deals_5",
        description: "Nagroda za aktywne dzielenie się okazjami",
        requirement: "Dodaj 5 zatwierdzonych ofert",
        points: 50
    },
    {
        icon: <Flame className="w-8 h-8 text-orange-500" />,
        name: "Gorąca okazja",
        code: "hot_50",
        description: "Twoja okazja zdobyła popularność wśród społeczności",
        requirement: "Miej ofertę z temperaturą +50 lub wyższą",
        points: 50
    },
    {
        icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
        name: "Komentator",
        code: "comments_10",
        description: "Nagroda za aktywny udział w dyskusjach",
        requirement: "Napisz 10 komentarzy (min. 3 znaki każdy)",
        points: 50
    },
    {
        icon: <ThumbsUp className="w-8 h-8 text-purple-500" />,
        name: "Pierwszy głos",
        code: "first_vote",
        description: "Nagroda za ocenianie ofert innych użytkowników",
        requirement: "Oceń swoją pierwszą ofertę (hot lub cold)",
        points: 50
    },
    {
        icon: <Image className="w-8 h-8 text-pink-500" />,
        name: "Avatar ustawiony",
        code: "avatar_set",
        description: "Nagroda za personalizację profilu",
        requirement: "Dodaj zdjęcie profilowe do swojego konta",
        points: 50
    }
];

const ZasadyOdznakStrona: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            {/* Nagłówek */}
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 mb-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                    <Award className="w-12 h-12" />
                    <h1 className="text-3xl font-bold">Zasady odznak</h1>
                </div>
                <p className="text-lg opacity-90">
                    Zdobywaj odznaki za aktywność w serwisie! Każda odznaka daje <strong>+50 punktów</strong> do Twojego profilu.
                </p>
            </div>

            {/* Jak to działa */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 mb-8 transition-colors">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
                    🎯 Jak zdobywać odznaki?
                </h2>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors">
                        <div className="text-3xl mb-2">📝</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">Dodawaj okazje</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Dziel się promocjami ze społecznością</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors">
                        <div className="text-3xl mb-2">💬</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">Komentuj</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Bądź aktywny w dyskusjach</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-colors">
                        <div className="text-3xl mb-2">🔥</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">Głosuj</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Oceniaj oferty innych użytkowników</p>
                    </div>
                </div>
            </div>

            {/* Lista odznak */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden transition-colors">
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                        🏆 Dostępne odznaki
                    </h2>
                </div>

                <div className="divide-y dark:divide-gray-700">
                    {badgeRules.map((badge) => (
                        <div
                            key={badge.code}
                            className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                {/* Ikona */}
                                <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl transition-colors">
                                    {badge.icon}
                                </div>

                                {/* Treść */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                                            {badge.name}
                                        </h3>
                                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full transition-colors">
                                            +{badge.points} pkt
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-2 transition-colors">
                                        {badge.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium text-gray-500 dark:text-gray-500 transition-colors">Warunek:</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-medium transition-colors">
                                            {badge.requirement}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Podsumowanie */}
            <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white text-center">
                <h3 className="text-xl font-bold mb-2">💎 Zbieraj punkty i awansuj!</h3>
                <p className="opacity-90">
                    Im więcej odznak zdobędziesz, tym wyżej w rankingu się znajdziesz.
                    Każda odznaka to <strong>+50 punktów</strong> do Twojego profilu!
                </p>
            </div>
        </div>
    );
};

export default ZasadyOdznakStrona;
