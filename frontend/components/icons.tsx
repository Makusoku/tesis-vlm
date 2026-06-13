import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function IconBase({ children, className = "h-5 w-5", title, ...props }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
      {...props}
    >
      {children}
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <IconBase title="Hoja" {...props}>
      <path d="M11 20A7 7 0 0 1 4 13C4 6 13 3 20 4c1 7-2 16-9 16Z" />
      <path d="M6 18c4-5 8-8 14-14" />
    </IconBase>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <IconBase title="Subir" {...props}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16v4H4v-4" />
    </IconBase>
  );
}

export function DatabaseIcon(props: IconProps) {
  return (
    <IconBase title="Base de datos" {...props}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </IconBase>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <IconBase title="Formulario" {...props}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase title="Aprobado" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </IconBase>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconBase title="Alerta" {...props}>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <IconBase title="Imagen" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="10" r="1.5" />
      <path d="m21 16-5-5L5 19" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase title="Usuario" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase title="Cerrar sesión" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  );
}

export function GoogleIcon({ className = "h-5 w-5", title = "Google", ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label={title} {...props}>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.9A6 6 0 0 1 6.1 12c0-.66.11-1.3.31-1.9V7.5H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.5l3.35-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.94 5.5l3.35 2.6C7.2 7.74 9.4 5.98 12 5.98Z"
      />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <IconBase title="Mostrar contraseña" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <IconBase title="Ocultar contraseña" {...props}>
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2" />
      <path d="M9.5 5.4A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.7 3.7" />
      <path d="M6.6 6.6C3.6 8.6 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.4-1.5" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase title="Buscar" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <IconBase title="Trofeo" {...props}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M6 4H4v3a4 4 0 0 0 4 4" />
      <path d="M18 4h2v3a4 4 0 0 1-4 4" />
      <path d="M12 12v5" />
      <path d="M8 21h8" />
    </IconBase>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <IconBase title="Fijar" {...props}>
      <path d="M15 4 20 9" />
      <path d="M14 10 4 20" />
      <path d="m14 10-4-4 4-4 8 8-4 4-4-4Z" />
      <path d="M9 15 4 20" />
    </IconBase>
  );
}

export function SidebarPinIcon(props: IconProps) {
  return (
    <IconBase title="Fijar barra lateral" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 4v16" />
      <path d="M13 10h4" />
      <path d="M15 8v6" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase title="Siguiente" {...props}>
      <path d="m9 18 6-6-6-6" />
    </IconBase>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <IconBase title="Dashboard" {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </IconBase>
  );
}
