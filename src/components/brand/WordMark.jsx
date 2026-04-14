const sizes = {
  sm: 'text-xl tracking-[0.15em]',
  md: 'text-2xl tracking-[0.18em]',
  lg: 'text-4xl tracking-[0.2em]',
}

export default function WordMark({ size = 'md', color = 'ink' }) {
  const colorClass = color === 'cream' ? 'text-catalog-cream' : 'text-ink'

  return (
    <span className={`font-display ${colorClass} ${sizes[size] || sizes.md}`}>
      ALTIUS
    </span>
  )
}
