export default function AdminSectionView({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6">
      <h1 className="text-[20px] font-semibold leading-7 text-[#171D1C]">{title}</h1>
      <p className="mt-1 text-[14px] leading-5 text-[#4E616F]">
        This section is available from the admin sidebar. {title} content will go here.
      </p>
    </div>
  );
}
