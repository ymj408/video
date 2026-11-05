import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  focusable: false,
};

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.4c.55 4.5 2.3 6.25 6.8 6.8-4.5.55-6.25 2.3-6.8 6.8-.55-4.5-2.3-6.25-6.8-6.8 4.5-.55 6.25-2.3 6.8-6.8Z" />
      <path d="M18.5 16.2c.21 1.72.88 2.39 2.6 2.6-1.72.21-2.39.88-2.6 2.6-.21-1.72-.88-2.39-2.6-2.6 1.72-.21 2.39-.88 2.6-2.6Z" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5.4 20c.45-4 2.65-6 6.6-6s6.15 2 6.6 6" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m14.8 5.5-6 6.5 6 6.5" />
      <path d="M9 12h10" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.2 5.5 6 6.5-6 6.5" />
      <path d="M15 12H5" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7" />
      <path d="M8.5 7H17v8.5" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 16V4.8" />
      <path d="m7.7 9 4.3-4.2L16.3 9" />
      <path d="M4.5 15.2v3.1c0 .9.7 1.7 1.7 1.7h11.6c1 0 1.7-.8 1.7-1.7v-3.1" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.4" />
      <circle cx="8.4" cy="9.5" r="1.5" />
      <path d="m4.8 17 4.7-4.4 3.4 3 2.6-2.4 4 3.8" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 7.5V3.8l-2.1 2.1A8.1 8.1 0 0 0 4.3 9" />
      <path d="M4 16.5v3.7l2.1-2.1A8.1 8.1 0 0 0 19.7 15" />
      <path d="M4.4 9A8.1 8.1 0 0 1 17.9 5.9L20 3.8" />
      <path d="M19.6 15a8.1 8.1 0 0 1-13.5 3.1L4 20.2" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.4 4.4 4.4L19.2 7" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="m8.2 12.2 2.6 2.6 5.2-5.4" />
    </svg>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7.6v5.1" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.4 4.5 2.9 17.4A1.8 1.8 0 0 0 4.5 20h15a1.8 1.8 0 0 0 1.6-2.6L13.6 4.5a1.8 1.8 0 0 0-3.2 0Z" />
      <path d="M12 9v4.2" />
      <path d="M12 16.7h.01" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7.5V12l3.1 1.9" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3.5 8.5 4.7L12 12.9 3.5 8.2 12 3.5Z" />
      <path d="m4.5 12.3 7.5 4.2 7.5-4.2" />
      <path d="m4.5 16.2 7.5 4.2 7.5-4.2" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 5.8 6.2 6.2-6.2 6.2" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 6.8h15" />
      <path d="M9.2 6.8V4.5h5.6v2.3" />
      <path d="m6.6 6.8.8 12.1c.05.85.76 1.6 1.7 1.6h5.8c.94 0 1.65-.75 1.7-1.6l.8-12.1" />
      <path d="M10.2 10.4v6.2M13.8 10.4v6.2" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.4 5 6.2v5.6c0 4.1 2.7 7.4 7 8.8 4.3-1.4 7-4.7 7-8.8V6.2L12 3.4Z" />
      <path d="m8.8 11.8 2.2 2.2 4.3-4.5" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.2 3.5 9.7 8l4.5 1.5L9.7 11l-1.5 4.5L6.7 11 2.2 9.5 6.7 8l1.5-4.5Z" />
      <path d="m17 13 1 2.9 2.9 1-2.9 1-1 2.9-1-2.9-2.9-1 2.9-1 1-2.9Z" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.7 4.8H6.4c-1 0-1.9.8-1.9 1.9v10.6c0 1.1.9 1.9 1.9 1.9h7.3" />
      <path d="M16.6 8.5 20.1 12l-3.5 3.5" />
      <path d="M10 12h10" />
    </svg>
  );
}

export function SwitchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h12.5l-2.8-2.8" />
      <path d="M20 16H7.5l2.8 2.8" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

