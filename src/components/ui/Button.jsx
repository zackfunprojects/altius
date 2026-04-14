const variants = {
  primary: 'bg-summit-cobalt text-catalog-cream font-ui font-semibold text-sm rounded-lg hover:bg-summit-cobalt/90 transition-colors h-12',
  secondary: 'bg-transparent border border-trail-brown/40 text-ink font-ui font-medium text-sm rounded-lg hover:bg-cream-light transition-colors h-12',
  accent: 'bg-signal-orange text-catalog-cream font-ui font-semibold text-sm rounded-lg hover:bg-signal-orange/90 transition-colors h-12',
  ghost: 'bg-transparent text-trail-brown font-body text-sm hover:underline transition-colors',
  crt: 'bg-transparent border border-phosphor-green/30 text-phosphor-green font-mono text-[13px] rounded-md hover:bg-phosphor-green/10 transition-colors h-10',
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`${variants[variant] || variants.primary} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
