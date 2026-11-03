import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function ProductUnavailable() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-ink">This product isn't available</h1>
      <p className="mt-2 text-sm text-muted">
        It may have been removed or the link may be incorrect. Browse the full catalogue instead.
      </p>
      <Link to="/products" className="mt-6 inline-block">
        <Button variant="secondary">Back to Products</Button>
      </Link>
    </div>
  )
}
