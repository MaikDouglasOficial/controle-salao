import Image from 'next/image';
import Link from 'next/link';

interface ClientBrandHeaderProps {
  /** Título exibido abaixo do logo (ex.: "Área do cliente", "Agendar horário") */
  subtitle?: string;
  /** Se true, o logo é um link para /agendar */
  logoLink?: boolean;
  className?: string;
}

/**
 * Cabeçalho de marca da área do cliente — mesma identidade visual do admin (logo Corte-Já).
 */
export function ClientBrandHeader({ subtitle, logoLink = true, className = '' }: ClientBrandHeaderProps) {
  const content = (
    <>
      <Image
        src="/logo-corte-ja.png"
        alt="Corte-Já"
        width={416}
        height={416}
        quality={100}
        className="h-24 w-24 sm:h-28 sm:w-28 object-contain object-center select-none mx-auto"
        priority
        unoptimized
      />
      {subtitle && (
        <p className="mt-2 text-[11px] font-medium text-[var(--text-muted)] tracking-widest uppercase leading-tight">
          {subtitle}
        </p>
      )}
    </>
  );

  return (
    <div className={`text-center ${className}`}>
      {logoLink ? (
        <Link href="/agendar" className="inline-block focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded-xl">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
