export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M8 7.5h9.4L23.5 13.4V24.5H8V7.5z" fill="#f6f1e6" />
      <path d="M17.4 7.5V13.2H23.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11.3 18.3 14.1 21.1 20.4 14.6" fill="none" stroke="#1f7a4d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
