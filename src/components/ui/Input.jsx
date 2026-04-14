const variants = {
  cream: 'bg-cream-light border border-trail-brown/25 text-ink font-body placeholder:font-body placeholder:font-light placeholder:italic placeholder:text-trail-brown/50 focus:outline-none focus:border-summit-cobalt rounded-md px-4 py-3',
  crt: 'bg-[rgba(255,255,255,0.05)] border border-phosphor-green/20 text-catalog-cream font-mono placeholder:font-mono placeholder:text-phosphor-green/30 focus:outline-none focus:border-phosphor-green/50 rounded-md px-4 py-3',
}

export default function Input({
  variant = 'cream',
  as = 'input',
  className = '',
  ...props
}) {
  const Tag = as
  return (
    <Tag
      className={`${variants[variant] || variants.cream} w-full text-sm ${className}`}
      {...props}
    />
  )
}
