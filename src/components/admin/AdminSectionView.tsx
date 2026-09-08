import Link from "next/link";

export default function AdminSectionView({
  title,
  description,
  phase = "Later phase",
}: {
  title: string;
  description?: string;
  phase?: string;
}) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[#00696F]">
        {phase}
      </p>
      <h1 className="mt-2 text-[20px] font-semibold leading-7 text-[#171D1C]">{title}</h1>
      <p className="mt-1 text-[14px] leading-5 text-[#4E616F]">
        {description ||
          `${title} will be implemented in the next admin phase. The sidebar is in place so this area is ready to build.`}
      </p>
      <Link
        href="/admin"
        className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-[#00696F] px-4 text-[13px] font-semibold text-white hover:bg-[#00575C]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
