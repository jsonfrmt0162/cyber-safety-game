import "./DashboardSkeleton.css";

export default function DashboardSkeleton() {
  return (
    <div className="dash-skeleton">
      <div className="dash-skeleton-row">
        <div className="dash-skeleton-card big" />
        <div className="dash-skeleton-card big" />
      </div>

      <div className="dash-skeleton-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dash-skeleton-card topic" />
        ))}
      </div>
    </div>
  );
}
