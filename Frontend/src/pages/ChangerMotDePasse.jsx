import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import AccountCard, { AccountButton, AccountLabel, AccountMessage, accountInput } from '../components/AccountCard';
import { clearTokens, getAccessToken, getUser, scheduleAutoLogout, setTokens } from '../api/tokenStorage';

/**
 * Password change for a signed-in customer. Mandatory right after signing in with the temporary
 * password e-mailed when the shop created the account.
 */
export default function ChangerMotDePasse() {
  const user = getUser();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!getAccessToken()) return <Navigate to="/login" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ currentPassword: current, newPassword: password }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        clearTokens();
        window.location.replace(`/${window.location.pathname.split('/').filter(Boolean)[0]}/login`);
        return;
      }
      if (!res.ok) throw new Error(data?.message || 'Modification impossible.');
      const remember = localStorage.getItem('ne_remember') === '1';
      setTokens(data.accessToken, data.refreshToken, data.user, remember);
      scheduleAutoLogout();
      window.location.replace(`/${window.location.pathname.split('/').filter(Boolean)[0]}/`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const forced = user?.mustChangePassword;
  return (
    <AccountCard
      title={forced ? 'Choisissez votre mot de passe' : 'Changer mon mot de passe'}
      subtitle={forced
        ? 'Vous vous êtes connecté avec le mot de passe temporaire reçu par e-mail. Il ne sert qu’une fois : choisissez maintenant le vôtre.'
        : 'Saisissez votre mot de passe actuel puis le nouveau.'}
    >
      {error && <AccountMessage>{error}</AccountMessage>}
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <AccountLabel>{forced ? 'Mot de passe temporaire' : 'Mot de passe actuel'}</AccountLabel>
          <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={accountInput} />
        </label>
        <label className="block">
          <AccountLabel>Nouveau mot de passe</AccountLabel>
          <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" className={accountInput} />
        </label>
        <label className="block">
          <AccountLabel>Confirmer</AccountLabel>
          <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={accountInput} />
        </label>
        <AccountButton loading={loading} loadingLabel="Enregistrement…">Enregistrer</AccountButton>
      </form>
    </AccountCard>
  );
}
