type FigmaIconProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export default function FigmaIcon({ src, alt, width, height, className = "" }: FigmaIconProps) {
  return (
    <span
      className={`inline-flex overflow-clip shrink-0 ${className}`}
      style={{ width, height }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="size-full object-contain"
      />
    </span>
  );
}
