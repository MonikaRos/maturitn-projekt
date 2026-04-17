import React, { useState } from 'react';
import { loginUser, registerUser } from '../firebase/auth';

function LoginForm({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Vyplňte všetky polia');
      setLoading(false);
      return;
    }

    if (!isLogin && !displayName) {
      setError('Zadajte svoje meno');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov');
      setLoading(false);
      return;
    }

    try {
      let result;
      
      if (isLogin) {
        // Prihlásenie
        result = await loginUser(email, password);
      } else {
        // Registrácia
        result = await registerUser(email, password, displayName);
      }

      if (result.success) {
        console.log(' Prihlásenie/Registrácia úspešná, používateľ:', result.user);
        console.log(' isAdmin:', result.user.isAdmin);
        
        
        onLoginSuccess(result.user);
        
        
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        
        setError(result.error);
      }
    } catch (err) {
      setError('Nastala neočakávaná chyba');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Prepnutie medzi prihlásením a registráciou
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h2>{isLogin ? ' Prihlásenie' : ' Registrácia'}</h2>
        <p className="modal-subtitle">
          {isLogin 
            ? 'Vitajte späť! Prihláste sa do svojho účtu.' 
            : 'Vytvorte si účet a začnite cestovať v knihách!'
          }
        </p>

        {error && (
          <div className="error-message">
             {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Meno - len pri registrácii */}
          {!isLogin && (
            <div className="form-group">
              <label>Meno</label>
              <input
                type="text"
                placeholder="Vaše meno"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="vas@email.sk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Heslo */}
          <div className="form-group">
            <label>Heslo</label>
            <input
              type="password"
              placeholder="Minimálne 6 znakov"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Tlačidlo submit */}
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? ' Načítavam...' : (isLogin ? 'Prihlásiť sa' : ' Registrovať sa')}
          </button>
        </form>

        {/* Prepnutie medzi prihlásením a registráciou */}
        <div className="toggle-mode">
          {isLogin ? (
            <p>
              Ešte nemáte účet?{' '}
              <button onClick={toggleMode} className="toggle-button">
                Zaregistrujte sa
              </button>
            </p>
          ) : (
            <p>
              Už máte účet?{' '}
              <button onClick={toggleMode} className="toggle-button">
                Prihláste sa
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginForm;