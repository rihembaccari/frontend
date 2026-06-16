import './css/Logo.css';

export default function Logo() {
  return (
    <div className="logo-area">
      <div className="logo-hex">GP</div>
      <div>
        <span className="logo-text">
          Gestion<em>Pro</em>
        </span>
        <span className="logo-badge">v1.1</span>
      </div>
    </div>
  );
}