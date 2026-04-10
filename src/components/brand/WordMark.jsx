const sizes = {
  sm: 'text-xl tracking-[0.15em]',
  md: 'text-2xl tracking-[0.18em]',
  lg: 'text-4xl tracking-[0.2em]',
}

export default function WordMark({ size = 'md' }) {
  return (
    <span className={`font-display text-ink ${sizes[size]}`}>
      ALTIUS
    </span>
  )
}
