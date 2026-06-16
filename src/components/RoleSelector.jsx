import './css/RoleSelector.css'

// These strings match EXACTLY the enum in User.java
export const ROLE_KEYS = ['ADMIN', 'MANAGER', 'CHEF_PROJET', 'TEAM_MEMBER']

const ROLE_LABELS = ['Admin', 'Manager', 'Chef de Projet', 'Team Member']

export default function RoleSelector({ selected, onChange }) {
  return (
    <div className="role-grid">
      {ROLE_KEYS.map((key, index) => (
        <button
          key={key}
          className={`role-chip${selected === index ? ' active' : ''}`}
          onClick={() => onChange(index)}
        >
          <span className="role-dot" />
          {ROLE_LABELS[index]}
        </button>
      ))}
    </div>
  )
}