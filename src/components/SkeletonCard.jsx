export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/[0.05] bg-[#0d1424] p-4 ${className}`}>
      <div className="skeleton h-2.5 w-20 rounded-full mb-4" />
      <div className="skeleton h-7 w-14 rounded-full mb-2.5" />
      <div className="skeleton h-2 w-28 rounded-full" />
    </div>
  )
}
