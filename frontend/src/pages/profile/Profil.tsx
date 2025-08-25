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
  avatarUrl?: string | null;
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  const handleAvatarChange = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const token = getAuthToken();
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch('http://localhost:5023/konto/profil/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  setData(d => d ? { ...d, avatarUrl: json.avatarUrl as string } : d);
  window.dispatchEvent(new Event('profileChanged'));
    } catch (e:any) {
      alert(e.message || 'Nie udało się wgrać zdjęcia');
    } finally {
      setUploadingAvatar(false);
    }
  };

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
    <div className="py-10 bg-gradient-to-br from-blue-50 to-purple-50/60">
      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 backdrop-blur-md shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10" />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                {data?.avatarUrl ? (
                  <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-2xl border shadow ring-1 ring-black/5" />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-white border shadow ring-1 ring-black/5 flex items-center justify-center text-2xl sm:text-3xl font-black text-indigo-600">
                    {(data?.nick?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 cursor-pointer">
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleAvatarChange(f);}} />
                  <span className="px-2 py-1 text-xs rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700">{uploadingAvatar? 'Wgrywam...' : 'Zmień'}</span>
                </label>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{data?.nick || 'Użytkownik'}</h1>
                  {data?.rola && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">{data.rola}</span>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-600">Dołączył: {data?.dataRejestracji}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold shadow ring-1 ring-emerald-200">{data?.punkty ?? 0} pkt</div>
              <button onClick={startEdit} className="px-4 py-2 rounded-2xl bg-blue-600 text-white font-semibold shadow hover:-translate-y-0.5 hover:shadow-lg transition-transform">Edytuj profil</button>
            </div>
          </div>
        </div>

        {/* Quick nav by role */}
        {data?.rola && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={() => navigate('/uzytkownik/panel')} className="group rounded-2xl border bg-white/80 backdrop-blur-md p-4 shadow hover:shadow-lg transition-all text-left">
              <div className="font-semibold text-gray-900 flex items-center gap-2">🧩 Panel użytkownika <span className="opacity-0 group-hover:opacity-100 transition">→</span></div>
              <div className="text-xs text-gray-600 mt-1">Zarządzaj swoimi ofertami i komentarzami</div>
            </button>
            {(data.rola === 'Moderator' || data.rola === 'Admin') && (
              <button onClick={() => navigate('/moderator')} className="group rounded-2xl border bg-white/80 backdrop-blur-md p-4 shadow hover:shadow-lg transition-all text-left">
                <div className="font-semibold text-gray-900 flex items-center gap-2">⚖️ Panel moderatora <span className="opacity-0 group-hover:opacity-100 transition">→</span></div>
                <div className="text-xs text-gray-600 mt-1">Moderuj oferty i komentarze</div>
              </button>
            )}
            {data.rola === 'Admin' && (
              <button onClick={() => navigate('/admin')} className="group rounded-2xl border bg-white/80 backdrop-blur-md p-4 shadow hover:shadow-lg transition-all text-left">
                <div className="font-semibold text-gray-900 flex items-center gap-2">👑 Panel administratora <span className="opacity-0 group-hover:opacity-100 transition">→</span></div>
                <div className="text-xs text-gray-600 mt-1">Zarządzaj użytkownikami i treściami</div>
              </button>
            )}
          </div>
        )}

        {/* Main grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Account data / form */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-3xl border bg-white/80 backdrop-blur-md shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Dane konta</h2>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Nick</label>
                    <input value={nickEdit} onChange={e=>setNickEdit(e.target.value)} className="mt-1 w-full p-3 rounded-xl border bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Email</label>
                    <input value={emailEdit} onChange={e=>setEmailEdit(e.target.value)} className="mt-1 w-full p-3 rounded-xl border bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Aktualne hasło (jeśli zmieniasz)</label>
                    <input type="password" value={pwdCurrent} onChange={e=>setPwdCurrent(e.target.value)} className="mt-1 w-full p-3 rounded-xl border bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Nowe hasło</label>
                    <input type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)} className="mt-1 w-full p-3 rounded-xl border bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={cancelEdit} type="button" className="flex-1 p-3 rounded-xl border bg-white hover:bg-gray-50">Anuluj</button>
                    <button onClick={saveProfile} disabled={saving} className="flex-1 p-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 hover:shadow-lg transition">{saving? 'Zapisywanie...' : 'Zapisz'}</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Nick</span><span className="font-semibold text-gray-900">{data?.nick}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Email</span><span className="text-gray-900">{data?.email}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Rola</span><span className="font-semibold text-indigo-700">{data?.rola}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Punkty</span><span className="font-extrabold text-emerald-600 text-lg">{data?.punkty}</span></div>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white/70"><span className="text-gray-600">Data rejestracji</span><span className="text-gray-700">{data?.dataRejestracji}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Badges */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-3xl border bg-white/80 backdrop-blur-md shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">🏆 Odznaki ({data?.odznaki?.length || 0})</h2>
              </div>
              {data?.odznaki && data.odznaki.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.odznaki.map((odznaka) => (
                    <div
                      key={odznaka.idOdznaka}
                      className="group relative overflow-hidden rounded-2xl border bg-white/70 p-4 hover:shadow-xl transition-all">
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 rounded-full blur-2xl" />
                      <div className="relative flex items-center gap-4">
                        <div className="text-3xl drop-shadow-sm">{odznaka.ikona || '🏆'}</div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{odznaka.nazwa}</div>
                          <div className="text-xs text-gray-500">{odznaka.dataPrzyznania}</div>
                          <div className="mt-1 text-xs text-gray-600 line-clamp-2" title={odznaka.opis}>{odznaka.opis}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 border-2 border-dashed rounded-2xl bg-white/60">
                  <div className="text-4xl mb-2">🎯</div>
                  <div className="text-gray-700 font-semibold">Brak odznak</div>
                  <div className="text-sm text-gray-500 mt-1">Głosuj i dodawaj oferty, aby je zdobywać!</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;
