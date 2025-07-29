import { useEffect, useState } from 'react';
import { getAuthHeaders, isAuthenticated, logout } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

type OdznakaData = {
  idOdznaka: number;
  nazwa: string;
  opis: string;
  ikona: string;
  dataPrzyznania: string;
};

type ProfilData = {
  nick: string;
  email: string;
  rola: string;
  punkty: number;
  dataRejestracji: string;
  odznaki: OdznakaData[];
};

const Profil = () => {
  const [data, setData] = useState<ProfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfil = async () => {
      // Sprawdź czy użytkownik jest zalogowany
      if (!isAuthenticated()) {
        setErr('Musisz być zalogowany, aby zobaczyć profil!');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5023/konto/profil', {
          headers: getAuthHeaders()
        });
        
        if (res.status === 401) {
          // Token wygasł lub jest nieprawidłowy
          logout();
          setErr('Sesja wygasła. Zaloguj się ponownie.');
          setTimeout(() => navigate('/auth/login'), 2000);
        } else if (!res.ok) {
          setErr('Błąd pobierania danych profilu.');
        } else {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        setErr('Nie udało się połączyć z serwerem.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfil();
  }, [navigate]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 text-center">
        <div className="text-2xl mb-4">🔄</div>
        <div className="text-lg font-semibold">Ładowanie profilu...</div>
      </div>
    </div>
  );
  
  if (err) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 text-center">
        <div className="text-2xl mb-4">❌</div>
        <div className="text-lg font-semibold text-red-600">{err}</div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center py-12 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="w-full max-w-2xl p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 text-center">Profil użytkownika</h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
            <span className="font-semibold text-gray-700">Nick:</span>
            <span className="text-gray-900 font-bold">{data?.nick}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
            <span className="font-semibold text-gray-700">Email:</span>
            <span className="text-gray-900">{data?.email}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
            <span className="font-semibold text-gray-700">Rola:</span>
            <span className="text-custom-blue font-bold">{data?.rola}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
            <span className="font-semibold text-gray-700">Punkty:</span>
            <span className="text-green-600 font-bold text-xl">{data?.punkty}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
            <span className="font-semibold text-gray-700">Data rejestracji:</span>
            <span className="text-gray-600">{data?.dataRejestracji}</span>
          </div>
        </div>
        
        <div>
          <h3 className="text-2xl font-bold mb-6 text-gray-900">
            🏆 Odznaki ({data?.odznaki?.length || 0})
          </h3>
          
          {data?.odznaki && data.odznaki.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.odznaki.map((odznaka) => (
                <div
                  key={odznaka.idOdznaka}
                  className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 hover:shadow-xl transition-all"
                  title={`${odznaka.opis} - Przyznano: ${odznaka.dataPrzyznania}`}
                >
                  <div className="text-3xl">{odznaka.ikona || '🏆'}</div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{odznaka.nazwa}</div>
                    <div className="text-sm text-gray-500">{odznaka.dataPrzyznania}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300/50">
              <div className="text-4xl mb-4">🎯</div>
              <div className="text-gray-600 font-medium">Brak odznak</div>
              <div className="text-sm text-gray-500 mt-2">Zacznij być aktywny, aby zdobyć pierwsze odznaki!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profil;
