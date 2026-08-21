export default function NavSectionPage({ title }: { title: string }) {
  return (
    <div className="w-full max-w-[604px] mx-auto bg-white rounded-[16px] p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <h1 className="text-[18px] font-bold leading-7 text-[#0B1C30]">{title}</h1>
    </div>
  );
}
