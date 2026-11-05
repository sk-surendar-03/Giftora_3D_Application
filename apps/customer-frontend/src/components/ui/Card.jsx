export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-card border border-border bg-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
