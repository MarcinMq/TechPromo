import { Link } from 'react-router-dom';
import { Flame, Snowflake, MapPin, MessageCircle } from 'lucide-react';

function HomePage() {
  // Przykładowe dane promocji -
  const featuredDeals = [
    {
      id: 1,
      title: "iPhone 15 Pro 128GB",
      originalPrice: 5999,
      salePrice: 4599,
      discount: 23,
      votes: { hot: 124, cold: 8 },
      comments: 45,
      image: "📱",
      category: "Telefony",
      shop: "Media Expert"
    },
    {
      id: 2,
      title: "Samsung Galaxy Watch 6",
      originalPrice: 1299,
      salePrice: 899,
      discount: 31,
      votes: { hot: 89, cold: 12 },
      comments: 23,
      image: "⌚",
      category: "Smartwatche",
      shop: "RTV Euro AGD"
    },
    {
      id: 3,
      title: "Sony WH-1000XM5 Słuchawki",
      originalPrice: 1599,
      salePrice: 1199,
      discount: 25,
      votes: { hot: 156, cold: 3 },
      comments: 67,
      image: "🎧",
      category: "Audio",
      shop: "x-kom"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30">
      <div className="space-y-16 px-4 py-8">
        {/* Główna sekcja */}
        <div className="text-center py-20">
          <div className="relative">
            {/* Blur circles */}
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-500/20 rounded-full blur-3xl"></div>
            
            {/* Główny kontener */}
            <div className="relative bg-white/40 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/40 p-16 mx-4 overflow-hidden">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10"></div>
              
              <div className="relative z-10">
                <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tech</span>Promo
                </h1>
                <p className="mt-6 text-xl text-gray-700 max-w-3xl mx-auto font-medium">
                  Najlepsze promocje z elektroniki w jednym miejscu! Odkrywaj, głosuj i oszczędzaj razem ze społecznością.
                </p>
                <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
                  <Link to="/auth/register" className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative">Dołącz za darmo</span>
                  </Link>
                  <Link to="/deals" className="group relative px-10 py-4 bg-white/80 hover:bg-white/90 text-gray-900 rounded-2xl font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-white/50 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative">Przeglądaj okazje</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Polecane okazje */}
        <div>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center">
              <Flame className="w-10 h-10 mr-3 text-orange-500" />
              Najgorętsze okazje
            </h2>
            <Link to="/deals" className="text-lg font-bold text-blue-600 hover:text-purple-600 transition-colors">Zobacz wszystkie →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDeals.map(deal => (
              <div key={deal.id} className="group relative bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden transform hover:-translate-y-3 transition-all duration-500 border border-white/40 hover:shadow-3xl">
                {/* Nakładka karty */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="relative">
                    <div className="h-56 flex items-center justify-center bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm text-8xl">{deal.image}</div>
                    <div className="absolute top-6 right-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-4 py-2 rounded-2xl backdrop-blur-sm shadow-lg">-{deal.discount}%</div>
                  </div>
                  <div className="p-8">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{deal.category}</p>
                    <h3 className="mt-3 text-2xl font-bold text-gray-900 h-16 leading-tight">{deal.title}</h3>
                    <div className="mt-4 flex items-baseline space-x-3">
                      <span className="text-3xl font-black text-red-600">{deal.salePrice} zł</span>
                      <span className="text-lg line-through text-gray-400">{deal.originalPrice} zł</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 font-medium flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {deal.shop}
                    </p>
                    <div className="mt-6 pt-6 border-t border-gray-200/50 flex items-center justify-between">
                      <div className="flex space-x-3">
                        <button className="flex items-center space-x-2 bg-gradient-to-r from-red-100 to-pink-100 backdrop-blur-sm text-red-600 px-4 py-2 rounded-2xl font-bold hover:from-red-200 hover:to-pink-200 transition-all shadow-lg">
                          <Flame className="w-4 h-4" />
                          <span>{deal.votes.hot}</span>
                        </button>
                        <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-cyan-100 backdrop-blur-sm text-blue-600 px-4 py-2 rounded-2xl font-bold hover:from-blue-200 hover:to-cyan-200 transition-all shadow-lg">
                          <Snowflake className="w-4 h-4" />
                          <span>{deal.votes.cold}</span>
                        </button>
                      </div>
                      <div className="text-gray-600 text-lg font-bold flex items-center">
                        <MessageCircle className="w-5 h-5 mr-1" />
                        {deal.comments}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kategorie */}
        <div>
          <h2 className="text-4xl font-black text-gray-900 mb-10 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Popularne kategorie</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {['Telefony','Laptopy','Audio','TV','Gaming','Foto'].map((name, idx) => (
              <div key={idx} className="group relative flex flex-col items-center justify-center bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 transform hover:-translate-y-3 transition-all duration-500 border border-white/40 hover:shadow-3xl overflow-hidden">
                {/* Nakładka kategorii */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-6">{['📱','💻','🎧','📺','🎮','📷'][idx]}</div>
                  <div className="font-black text-xl text-gray-900 mb-2">{name}</div>
                  <div className="text-sm font-semibold text-gray-600">{[234,156,189,98,267,87][idx]} okazji</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jak to działa */}
        <div className="py-20">
          <h2 className="text-4xl font-black text-gray-900 text-center mb-12 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Jak to działa?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {num:1,title:'Znajdź okazję',desc:'Przeglądaj tysiące promocji z elektroniki lub dodaj własną znalezioną w sieci'},
              {num:2,title:'Głosuj',desc:'Oceń promocje jako "HOT" lub "COLD" i pomóż innym znaleźć najlepsze okazje'},
              {num:3,title:'Dyskutuj',desc:'Komentuj, zadawaj pytania i dziel się opiniami ze społecznością'},
              {num:4,title:'Oszczędzaj',desc:'Korzystaj z najlepszych promocji i buduj swoją reputację w społeczności'}
            ].map(step => (
              <div key={step.num} className="group relative p-10 bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl text-center border border-white/40 hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                {/* Nakładka kroku */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="text-6xl font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-6">{step.num}</div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-lg text-gray-700 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
