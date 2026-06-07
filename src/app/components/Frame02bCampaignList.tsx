import { motion } from "motion/react";
import {
  Search, Plus, ChevronRight, LayoutGrid, Folder,
  Settings, HelpCircle, Filter, Bell, SlidersHorizontal, MoreHorizontal
} from "lucide-react";

interface Props {
  onBack: () => void;
  onNewCampaign: () => void;
  onOpenCampaign: () => void;
}

const campaigns = [
  { id: 1, name: "Mundial 2026", client: "éxito", status: "active", previews: 2, updated: "2h ago" },
  { id: 2, name: "Evento Etto Q2", client: "éxito", status: "review", previews: 4, updated: "2h ago" },
  { id: 3, name: "Catálogos Junio", client: "éxito", status: "draft", previews: 8, updated: "2h ago" },
  { id: 4, name: "Diageo HotSale", client: "Diageo", status: "done", previews: 6, updated: "2h ago" },
  { id: 5, name: "Q3 Brand Refresh", client: "Apex Corp", status: "active", previews: 8, updated: "1w ago" },
  { id: 6, name: "Summer Launch 2026", client: "Bloom Studio", status: "review", previews: 14, updated: "Yesterday" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  review: { label: "Review", className: "bg-red-100 text-red-600" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-500" },
  done: { label: "Done", className: "bg-gray-900 text-white" },
};

export function Frame02bCampaignList({ onBack, onNewCampaign, onOpenCampaign }: Props) {
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">

      {/* ── SIDEBAR ── */}
      <div className="w-56 border-r border-gray-100 flex flex-col py-5 px-3 shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-2 px-2 mb-7">
          <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center shrink-0">
            <svg width="13" height="11" viewBox="0 0 12.9104 10.3283" fill="none">
              <path d="M12.799 0.211896V8.32163H6.49027V6.51912H10.9965V2.0144H1.98553V0.211896H12.799Z" fill="white"/>
              <path d="M6.49032 8.32165V10.1241H0.183076V2.0144H1.98558V8.32165H6.49032Z" fill="white"/>
            </svg>
          </div>
          <span className="text-gray-900 text-sm font-semibold tracking-tight">VisionStudio</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] transition-all duration-100 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <LayoutGrid size={14} />
            Dashboard
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] transition-all duration-100 bg-gray-100 text-gray-900 font-medium"
          >
            <Folder size={14} />
            Campaigns
          </button>
        </nav>

        {/* Bottom nav */}
        <div className="space-y-0.5 pt-4 border-t border-gray-100">
          {[
            { icon: Settings, label: "Settings" },
            { icon: HelpCircle, label: "Help" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer text-[13px] transition-all duration-100"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}

          {/* User avatar */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-[#6B46C1] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-semibold">FC</span>
            </div>
            <div>
              <p className="text-gray-700 text-xs font-medium">Fabian Caamaño</p>
              <p className="text-gray-400 text-[11px]">Designer</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-8 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-gray-50 rounded-xl px-3.5 py-2">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-[13px]"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer text-[13px] transition-all duration-100">
              <Filter size={13} />
              Filter
            </button>
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-100">
              <SlidersHorizontal size={13} />
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button className="relative p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-100">
              <Bell size={15} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-7">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-widest mb-1">All Campaigns</p>
              <h2 className="text-gray-900 text-xl font-semibold tracking-tight">Campaigns</h2>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1">
              {["All", "Active", "In Review", "Done"].map((f, i) => (
                <button
                  key={f}
                  className={`px-3.5 py-1.5 rounded-full cursor-pointer text-[13px] transition-all duration-100 ${
                    i === 0
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Create New Campaign featured card */}
          <motion.button
            whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            onClick={onNewCampaign}
            className="w-full flex items-center gap-5 bg-white border border-gray-100 rounded-2xl px-6 py-5 mb-5 cursor-pointer text-left hover:border-gray-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 group-hover:bg-gray-800 transition-colors duration-150">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <p className="text-gray-900 text-[15px] font-semibold tracking-tight mb-0.5">Create New Campaign</p>
              <p className="text-gray-400 text-[13px]">Start a new campaign and generate previews faster</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 ml-auto shrink-0 group-hover:text-gray-500 transition-colors duration-150" />
          </motion.button>

          {/* Campaign grid — same 2-column card style as dashboard */}
          <div className="grid grid-cols-2 gap-5">
            {campaigns.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                onClick={onOpenCampaign}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 hover:shadow-lg hover:shadow-black/[0.06] transition-all duration-200"
              >
                {/* Checkerboard thumbnail */}
                <div className="relative preview-checkerboard rounded-xl m-3 h-40 overflow-hidden">
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig[c.status].className}`}>
                      {statusConfig[c.status].label}
                    </span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gray-900/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                    <div className="bg-white/90 rounded-xl shadow-sm px-4 py-2 flex items-center gap-2">
                      <ChevronRight size={13} className="text-gray-700" />
                      <span className="text-gray-800 text-xs font-medium">Open campaign</span>
                    </div>
                  </div>
                </div>

                {/* Card info */}
                <div className="px-4 py-3 flex items-end justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 truncate text-[13px] font-semibold tracking-tight mb-0.5">{c.name}</p>
                    <p className="text-gray-400 text-xs">{c.client}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-gray-600 text-xs font-medium mb-0.5">{c.previews} previews</p>
                    <p className="text-gray-300 text-[11px]">{c.updated}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Floating nav pill ── */}
      <div className="fixed bottom-6 right-6 z-50">
        
      </div>

    </div>
  );
}
