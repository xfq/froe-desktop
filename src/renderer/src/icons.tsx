import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconFrame({ children, ...props }: IconProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" {...props}>
      {children}
    </svg>
  );
}

export function WedgeMark(props: IconProps): React.JSX.Element {
  return (
    <IconFrame {...props}>
      <path d="M4 19V5l15 7-15 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
      <path d="M4 5l7 7-7 7" stroke="currentColor" strokeWidth="2" />
    </IconFrame>
  );
}

export function FolderIcon(props: IconProps): React.JSX.Element {
  return (
    <IconFrame {...props}>
      <path d="M3.5 6.5h6l2 2h9v9h-17v-11Z" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function ImageIcon(props: IconProps): React.JSX.Element {
  return (
    <IconFrame {...props}>
      <rect x="4" y="5" width="16" height="14" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="m6.5 17 4-4 2.5 2.5 2-2 2.5 3.5" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function SendIcon(props: IconProps): React.JSX.Element {
  return (
    <IconFrame {...props}>
      <path d="m4 5 16 7-16 7 3-7-3-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="miter" />
      <path d="M7 12h11" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function StopIcon(props: IconProps): React.JSX.Element {
  return (
    <IconFrame {...props}>
      <rect x="6" y="6" width="12" height="12" fill="currentColor" />
    </IconFrame>
  );
}

export function SettingsIcon(props: IconProps): React.JSX.Element {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function CloseIcon(props: IconProps): React.JSX.Element {
  return (
    <IconFrame {...props}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function ChevronIcon(props: IconProps): React.JSX.Element {
  return (
    <IconFrame {...props}>
      <path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

