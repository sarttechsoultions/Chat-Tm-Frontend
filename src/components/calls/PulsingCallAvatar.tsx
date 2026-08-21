import Image from "next/image";

export default function PulsingCallAvatar({ src }: { src: string }) {
  return (
    <div className="relative size-[192px]">
      <div className="absolute -inset-12 rounded-full bg-[rgba(0,105,111,0.2)]" />
      <div className="absolute -inset-6 rounded-full bg-[rgba(0,105,111,0.1)]" />
      <div className="relative size-[192px] overflow-hidden rounded-full border-4 border-[#F8F9FF] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <Image
          src={src}
          alt="Emma Watson"
          fill
          sizes="192px"
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
