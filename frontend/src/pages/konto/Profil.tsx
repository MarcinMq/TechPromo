import { useEffect, useState } from 'react';

type ProfilData = {
  nick: string;
  email: string;
  rola: string;
  punkty: number;
  dataRejestracji: string;
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
      {/* Tu możesz dodać więcej pól z ERD np. odznaki */}
    </div>
  );
};

export default Profil;
