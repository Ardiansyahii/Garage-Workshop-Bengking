import { FolderSearch } from "lucide-react";

export default function EmptyState({
  icon: Icon = FolderSearch,
  title = "Data Tidak Ditemukan",
  description = "Belum ada informasi atau riwayat data yang tersedia saat ini.",
  actionText,
  onAction,
}) {
  return (
    <div className="bg-white p-14 rounded-3xl text-center border border-[#E5E5E5] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] space-y-4 my-6">
      <div className="w-16 h-16 bg-[#111111] border border-[#0A0A0A] rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-black/20">
        <Icon className="w-8 h-8 animate-bounce" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-black text-[#111111] tracking-tight">
          {title}
        </h3>
        <p className="text-[#6B7280] text-xs leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-black/20 cursor-pointer inline-flex items-center gap-1.5 mt-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}