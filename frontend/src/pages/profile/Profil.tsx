import { useEffect, useState } from 'react';
import { getAuthHeaders, isAuthenticated, logout, saveUserSession, getAuthToken } from '../../utils/auth';
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
  const [editing, setEditing] = useState(false);
  const [nickEdit, setNickEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [saving, setSaving] = useState(false);
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

  const startEdit = () => {
    if (!data) return;
    setNickEdit(data.nick);
    setEmailEdit(data.email);
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setPwdCurrent(''); setPwdNew(''); };

  const saveProfile = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const body:any = {};
      if (nickEdit !== data.nick) body.nick = nickEdit;
      if (emailEdit !== data.email) body.email = emailEdit;
      if (pwdNew) { body.hasloAktualne = pwdCurrent; body.hasloNowe = pwdNew; }
      const token = getAuthToken();
      const res = await fetch('http://localhost:5023/konto/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      // odśwież localStorage jeśli token wrócił
      if (json.token) {
        saveUserSession({ token: json.token, nick: json.nick, email: json.email, rola: json.rola, punkty: json.punkty });
      }
      setData(d => d ? { ...d, nick: json.nick, email: json.email } : d);
      setEditing(false);
    } catch(e:any) {
      alert(e.message || 'Błąd zapisu profilu');
    } finally { setSaving(false); }
  };

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
          {editing ? (
            <>
              <div className="p-4 bg-white/50 rounded-2xl border flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600">Nick</label>
                <input value={nickEdit} onChange={e=>setNickEdit(e.target.value)} className="p-3 rounded-xl border bg-white/80" />
              </div>
              <div className="p-4 bg-white/50 rounded-2xl border flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <input value={emailEdit} onChange={e=>setEmailEdit(e.target.value)} className="p-3 rounded-xl border bg-white/80" />
              </div>
              <div className="p-4 bg-white/50 rounded-2xl border flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600">Aktualne hasło (jeśli zmieniasz hasło)</label>
                <input type="password" value={pwdCurrent} onChange={e=>setPwdCurrent(e.target.value)} className="p-3 rounded-xl border bg-white/80" />
              </div>
              <div className="p-4 bg-white/50 rounded-2xl border flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600">Nowe hasło</label>
                <input type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)} className="p-3 rounded-xl border bg-white/80" />
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={cancelEdit} type="button" className="flex-1 p-3 rounded-xl border bg-white hover:bg-gray-100">Anuluj</button>
                <button onClick={saveProfile} disabled={saving} className="flex-1 p-3 rounded-xl bg-custom-blue text-white font-semibold disabled:opacity-50">{saving? 'Zapisywanie...' : 'Zapisz'}</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border"><span className="font-semibold text-gray-700">Nick:</span><span className="text-gray-900 font-bold">{data?.nick}</span></div>
              <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border"><span className="font-semibold text-gray-700">Email:</span><span className="text-gray-900">{data?.email}</span></div>
              <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border"><span className="font-semibold text-gray-700">Rola:</span><span className="text-custom-blue font-bold">{data?.rola}</span></div>
              <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border"><span className="font-semibold text-gray-700">Punkty:</span><span className="text-green-600 font-bold text-xl">{data?.punkty}</span></div>
              <div className="flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border"><span className="font-semibold text-gray-700">Data rejestracji:</span><span className="text-gray-600">{data?.dataRejestracji}</span></div>
              <div className="pt-2 text-right">
                <button onClick={startEdit} className="px-4 py-2 rounded-xl bg-custom-blue text-white font-semibold hover:bg-blue-700">Edytuj profil</button>
              </div>
            </>
          )}
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
