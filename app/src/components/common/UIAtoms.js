import Link from 'next/link';

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  href, 
  onClick, 
  type = 'button',
  disabled = false,
  icon,
  ...props 
}) {
  const baseClass = `btn-${variant} ${className}`;
  
  const content = (
    <>
      {children}
      {icon && <span className="material-symbols-outlined">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClass} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button 
      type={type} 
      className={baseClass} 
      onClick={onClick} 
      disabled={disabled}
      {...props}
    >
      {content}
    </button>
  );
}

export function Card({ children, variant = 'glass', className = '', hover = false, ...props }) {
  const cardClass = `${variant === 'glass' ? 'glass-card' : 'flat-card'} ${hover ? 'hover-lift' : ''} ${className}`;
  return (
    <div className={cardClass} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'purple', icon, className = '', ...props }) {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {icon && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>}
      {children}
    </span>
  );
}
