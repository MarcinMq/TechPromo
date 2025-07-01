import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetch('http://localhost:5023/konto/profil', {
          credentials: 'include',
        });
        if (res.status === 401) {
          setErr('Musisz być zalogowany, aby zobaczyć profil!');
        } else if (!res.ok) {
          setErr('Błąd pobierania danych profilu.');
        } else {
          const json = await res.json();
          setData(json);
        }
      } catch {
        setErr('Nie udało się połączyć z serwerem.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfil();
  }, []);

  if (loading) return <div className="auth-form">Ładowanie profilu...</div>;
  if (err) return <div className="auth-form" style={{ color: "crimson" }}>{err}</div>;

  return (
    <div className="auth-form" style={{ maxWidth: 440 }}>
      <h2>Profil użytkownika</h2>
      <div><b>Nick:</b> {data?.nick}</div>
      <div><b>Email:</b> {data?.email}</div>
      <div><b>Rola:</b> {data?.rola}</div>
      <div><b>Punkty:</b> {data?.punkty}</div>
      <div><b>Data rejestracji:</b> {data?.dataRejestracji}</div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Odznaki ({data?.odznaki?.length || 0})</h3>
        {data?.odznaki && data.odznaki.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {data.odznaki.map((odznaka) => (
              <div 
                key={odznaka.idOdznaka} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '10px', 
                  minWidth: '120px',
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9'
                }}
                title={`${odznaka.opis} - Przyznano: ${odznaka.dataPrzyznania}`}
              >
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                  {odznaka.ikona || '🏆'}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                  {odznaka.nazwa}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                  {odznaka.dataPrzyznania}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic', marginTop: '10px' }}>
            Brak odznak
          </div>
        )}
      </div>
    </div>
  );
};

export default Profil;
