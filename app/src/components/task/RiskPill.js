import { RISK_LEVELS } from '@/utils/constants';

export default function RiskPill({ level = 'LOW', showLabel = true, className = '' }) {
  const config = RISK_LEVELS[level] || RISK_LEVELS.LOW;
  
  return (
    <span className={`badge badge-${config.color} ${className}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        {config.icon}
      </span>
      {showLabel && config.label}
    </span>
  );
}
