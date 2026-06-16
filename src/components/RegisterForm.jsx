/*import { useState } from 'react'
import Logo from './Logo'
import RoleSelector, { ROLE_KEYS } from './RoleSelector'
import { registerUser } from '../services/authService'
import './LoginForm.css'

export default function RegisterForm({ onSwitchToLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState(0)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [nom,    setNom]    = useState('')
const [prenom, setPrenom] = useState('')

  const handleRegister = async () => {
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      // sends { email, password, role } — role is e.g. "CHEF_PROJET"
      await registerUser(email, password,nom, prenom)
      setSuccess(true)
      setTimeout(() => onSwitchToLogin(), 1800)
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-left">
      <div>
        <Logo />

        <div className="welcome-line">→ Create your account</div>
        <h1 className="form-title">Register.</h1>
        <p className="form-sub">Choose your role and set up your credentials.</p>

        {/* Role selector is here — it gets sent to /api/auth/register */}
       /* <RoleSelector selected={role} onChange={setRole} />

        {error   && <div className="msg err-msg">⚠ {error}</div>}
        {success && <div className="msg ok-msg">✓ Account created — redirecting to login...</div>}

        <div className="field">
          <label className="field-label">Email address</label>
          <div className="input-wrap">
            <svg className="input-ico" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <input
              className="input"
              type="email"
              placeholder="firstname.lastname@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <div className="input-wrap">
            <svg className="input-ico" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <input
              className="input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
  <label className="field-label">Prénom</label>
  <div className="input-wrap">
    <input
      className="input"
      type="text"
      placeholder="Votre prénom"
      value={prenom}
      onChange={e => setPrenom(e.target.value)}
    />
  </div>
</div>

<div className="field">
  <label className="field-label">Nom</label>
  <div className="input-wrap">
    <input
      className="input"
      type="text"
      placeholder="Votre nom de famille"
      value={nom}
      onChange={e => setNom(e.target.value)}
    />
  </div>
</div>

        <button
          className="btn-login"
          onClick={handleRegister}
          disabled={loading || success}
          style={{ marginTop: '0.5rem' }}
        >
          {loading ? 'Creating account...' : 'Create account →'}
        </button>

        <p className="switch-link">
          Already have an account?{' '}
          <button className="link-btn" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>

      <div className="card-footer">
        GestionPro · Clinisys © 2026 · Authorized access only
      </div>
    </div>
  )
}/*