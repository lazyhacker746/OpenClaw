
export default function Logo({ className = 'h-10 w-10', title = 'Clarion' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <rect x="3" y="3" width="42" height="42" rx="14" fill="#4F46E5" />
      <path
        d="M16 24.25C16 18.585 20.585 14 26.25 14H33V19H26.25C23.35 19 21 21.35 21 24.25C21 27.15 23.35 29.5 26.25 29.5H33V34.5H26.25C20.585 34.5 16 29.915 16 24.25Z"
        fill="white"
      />
      <path d="M29.5 20.5L36 24.25L29.5 28V20.5Z" fill="#99F6E4" />
      <circle cx="13.5" cy="14.5" r="2.5" fill="#99F6E4" />
    </svg>
  );
}
