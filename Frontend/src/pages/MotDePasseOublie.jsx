import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccountCard, { AccountButton, AccountLabel, AccountMessage, accountInput } from '../components/AccountCard';

const API = 'http://localhost:8080/api/v1/auth';

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || 'Une erreur est survenue.');
  return data;
}

/** Customer password reset for this shop: e-mail → six-digit code → new password. */
export default function MotDePasseOublie() {
  const shopSlug = window.location.pathname.split('/').filter(Boolean)[0];
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await post('/forgot-password', { email, shopSlug });
      setInfo(data?.message || '');
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      await post('/reset-password', { email, code, password });
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountCard
      title={step === 'done' ? 'Mot de passe modifié' : 'Mot de passe oublié'}
      subtitle={
        step === 'email' ? 'Saisissez l’e-mail de votre compte : nous vous envoyons un code à 6 chiffres.'
          : step === 'code' ? `Saisissez le code reçu à ${email} et votre nouveau mot de passe.`
            : 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'
      }
      footer={<Link to="/login" className="hover:underline">← Retour à la connexion</Link>}
    >
      {error && <AccountMessage>{error}</AccountMessage>}

      {step === 'email' && (
        <form onSubmit={requestCode} className="space-y-5">
          <label className="block">
            <AccountLabel>Adresse e-mail</AccountLabel>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className={accountInput} />
          </label>
          <AccountButton loading={loading} loadingLabel="Envoi…">Recevoir un code</AccountButton>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={reset} className="space-y-5">
          {info && <AccountMessage tone="info">{info}</AccountMessage>}
          <label className="block">
            <AccountLabel>Code à 6 chiffres</AccountLabel>
            <input
              required inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${accountInput} tracking-[0.5em] text-center text-lg font-semibold`}
            />
          </label>
          <label className="block">
            <AccountLabel>Nouveau mot de passe</AccountLabel>
            <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" className={accountInput} />
          </label>
          <label className="block">
            <AccountLabel>Confirmer</AccountLabel>
            <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={accountInput} />
          </label>
          <AccountButton loading={loading} loadingLabel="Enregistrement…">Changer le mot de passe</AccountButton>
          <button type="button" onClick={requestCode} disabled={loading} className="w-full text-xs hover:underline" style={{ color: '#727974' }}>
            Renvoyer un code
          </button>
        </form>
      )}

      {step === 'done' && (
        <Link to="/login" className="block w-full py-3 rounded-xl font-bold text-sm text-white text-center" style={{ backgroundColor: 'rgb(var(--rgb-primary))' }}>
          Se connecter
        </Link>
      )}
    </AccountCard>
  );
}
