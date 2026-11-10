import { FolderSearch } from "lucide-react";

export default function EmptyState({
  icon: Icon = FolderSearch,
  title = "Data Tidak Ditemukan",
  description = "Belum ada informasi atau riwayat data yang tersedia saat ini.",
  actionText,
  onAction,
}) {
  return (
    <div className="bg-zinc-950/85 backdrop-blur-md p-14 rounded-3xl text-center border border-zinc-900 shadow-2xl space-y-4 my-6">
      <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-red-500 shadow-inner">
        <Icon className="w-8 h-8 animate-bounce" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-black text-white tracking-tight">
          {title}
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-red-600/20 cursor-pointer inline-flex items-center gap-1.5 mt-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
