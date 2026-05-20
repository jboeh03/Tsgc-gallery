export default function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
      <p className="font-display text-lg text-navy">{title}</p>
      {body && <p className="mt-2 text-sm text-ink/65 max-w-md mx-auto">{body}</p>}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}
