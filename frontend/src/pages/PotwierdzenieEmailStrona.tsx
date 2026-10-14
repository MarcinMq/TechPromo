import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicPost } from '../utils/api';

export default function PotwierdzenieEmailStrona() {
  const [parameters] = useState(() => new URLSearchParams(window.location.hash.slice(1)));
  const [message, setMessage] = useState(parameters.get('token') ? '' : 'Link potwierdzenia jest nieprawidłowy.');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { window.history.replaceState(null, '', window.location.pathname); }, []);

  const confirm = async () => {
    setBusy(true);
    try {
      const response = await publicPost('/konto/potwierdz-email', {
        userId: Number(parameters.get('userId')),
        token: parameters.get('token'),
        email: parameters.get('email') || null
      });
      if (!response.ok) throw new Error('Link jest nieprawidłowy lub wygasł.');
      setMessage('Adres e-mail został potwierdzony. Zaloguj się ponownie.');
      setDone(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nie udało się potwierdzić adresu.');
    } finally { setBusy(false); }
  };

  return <section className="mx-auto max-w-md py-12">
    <h1 className="mb-6 text-2xl font-semibold">Potwierdzenie adresu e-mail</h1>
    {message && <p role="status" className="mb-4">{message}</p>}
    {!done && <button disabled={busy || !parameters.get('token')} onClick={confirm}
      className="rounded bg-red-600 px-5 py-3 text-white disabled:opacity-50">
      {busy ? 'Potwierdzanie...' : 'Potwierdź adres'}
    </button>}
    {done && <Link to="/auth/login" className="text-red-600 underline">Zaloguj się</Link>}
  </section>;
}
