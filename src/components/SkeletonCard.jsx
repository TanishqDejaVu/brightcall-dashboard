export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <div className="skeleton h-3 w-24 rounded mb-3" />
      <div className="skeleton h-8 w-16 rounded mb-2" />
      <div className="skeleton h-2.5 w-32 rounded" />
    </div>
  )
}
