export default function NavSectionPage({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-[604px] rounded-[16px] bg-white p-5 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] sm:p-6">
      <h1 className="text-[18px] font-bold leading-7 text-[#0B1C30]">{title}</h1>
    </div>
  );
}
