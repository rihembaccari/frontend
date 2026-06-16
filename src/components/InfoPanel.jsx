import './css/InfoPanel.css';

export default function InfoPanel() {
  return (
    <div className="card-right">
      <div className="cr-pattern" />
      <div className="cr-circle1" />
      <div className="cr-circle2" />

      <div className="cr-top">
        <div className="cr-module-label">Project Management Platform · Clinisys</div>
        <div className="cr-title">
          Manage your<br />deployments<br />with clarity.
        </div>
        <p className="cr-desc">
          A single source of truth for all your ERP project activities —
          from project charter and RACI planning to status reporting
          and change management.
        </p>
      </div>
    </div>
  );
}