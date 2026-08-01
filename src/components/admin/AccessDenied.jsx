export default function AccessDenied({ title = '403 — Access Denied', message = "You don't have permission to access this page." }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-500">
        403
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{message}</p>
    </div>
  );
}
