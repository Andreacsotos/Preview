export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#101828] flex items-center justify-center shrink-0">
        <div className="w-4 h-4 rounded-sm bg-white opacity-90" />
      </div>
      <span
        className="text-[#101828] tracking-tight"
        style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px" }}
      >
        VisionStudio
      </span>
    </div>
  );
}
