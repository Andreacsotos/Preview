export default function Mockup() {
  return (
    <div className="relative w-full h-full">
      {/* Main browser window */}
      <div
        className="absolute inset-0 bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)" }}
      >
        {/* Browser chrome */}
        <div className="h-9 bg-[#F3F5F7] border-b border-[#E5E7EB] flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#E5E7EB]" />
            <div className="w-3 h-3 rounded-full bg-[#E5E7EB]" />
            <div className="w-3 h-3 rounded-full bg-[#E5E7EB]" />
          </div>
          <div className="flex-1 mx-4 h-5 rounded-md bg-white border border-[#E5E7EB]" />
        </div>

        {/* App UI */}
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-32 border-r border-[#F3F4F6] bg-white pt-4 px-2 flex flex-col gap-1">
            {["Dashboard", "Campaigns", "Starred", "Recent"].map((item, i) => (
              <div
                key={item}
                className={`h-6 rounded-lg ${i === 0 ? "bg-[#F3F4F6]" : ""}`}
                style={{ width: i === 0 ? "88%" : `${60 + (i * 7)}%` }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 bg-white">
            {/* Top bar */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 h-7 rounded-lg bg-[#F9FAFB] border border-[#F3F4F6]" />
              <div className="w-16 h-7 rounded-lg bg-[#101828]" />
            </div>

            {/* Campaign cards grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {[
                { status: "active", statusColor: "#D1FAE5", statusText: "#065F46" },
                { status: "review", statusColor: "#FEE2E2", statusText: "#991B1B" },
                { status: "draft", statusColor: "#F3F4F6", statusText: "#6B7280" },
                { status: "done", statusColor: "#101828", statusText: "#FFFFFF" },
              ].map((card, i) => (
                <div key={i} className="rounded-xl border border-[#F3F4F6] overflow-hidden bg-white">
                  {/* Card thumbnail — checkerboard */}
                  <div
                    className="h-14 m-1.5 rounded-lg"
                    style={{
                      backgroundColor: "#F9FAFB",
                      backgroundImage: `linear-gradient(45deg, #E5E7EB 25%, transparent 25%), linear-gradient(-45deg, #E5E7EB 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #E5E7EB 75%), linear-gradient(-45deg, transparent 75%, #E5E7EB 75%)`,
                      backgroundSize: "8px 8px",
                      backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                    }}
                  >
                    <div className="flex justify-end p-1.5">
                      <div
                        className="px-1.5 py-0.5 rounded-full text-[6px] font-semibold"
                        style={{ backgroundColor: card.statusColor, color: card.statusText, fontSize: "7px" }}
                      >
                        {card.status}
                      </div>
                    </div>
                  </div>
                  {/* Card info */}
                  <div className="px-2 pb-2 flex justify-between items-end">
                    <div>
                      <div className="h-2 w-16 rounded bg-[#101828] mb-1" />
                      <div className="h-1.5 w-10 rounded bg-[#E5E7EB]" />
                    </div>
                    <div className="text-right">
                      <div className="h-1.5 w-10 rounded bg-[#E5E7EB] mb-1" />
                      <div className="h-1.5 w-7 rounded bg-[#F3F4F6]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent previews row */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 rounded-xl border border-[#F3F4F6] overflow-hidden bg-white">
                  <div
                    className="h-10 m-1 rounded-lg"
                    style={{
                      backgroundColor: "#F9FAFB",
                      backgroundImage: `linear-gradient(45deg, #E5E7EB 25%, transparent 25%), linear-gradient(-45deg, #E5E7EB 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #E5E7EB 75%), linear-gradient(-45deg, transparent 75%, #E5E7EB 75%)`,
                      backgroundSize: "8px 8px",
                      backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                    }}
                  />
                  <div className="px-1.5 pb-1.5">
                    <div className="h-1.5 w-12 rounded bg-[#101828] mb-1" />
                    <div className="h-1.5 w-8 rounded bg-[#E5E7EB]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
