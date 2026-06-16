import './css/PendingPage.css'

export default function PendingPage({ email, onLogout }) {
  return (
    <div className="pending-root">
      <div className="pending-card">
        <div className="pending-icon">⏳</div>
        <h1 className="pending-title">Account Pending Approval</h1>
        <p className="pending-sub">
          Your account <strong>{email}</strong> has been created successfully.
          An administrator needs to assign your role before you can access the platform.
        </p>
        <div className="pending-status">
          <span className="status-dot" />
          Waiting for admin approval...
        </div>
        <button className="pending-logout" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  )
}