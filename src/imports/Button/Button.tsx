import { ArrowRight } from "lucide-react";

interface ButtonProps {
  label?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export default function Button({ label = "Continue", onClick, variant = "primary" }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-2xl px-6 py-4 text-[16px] font-medium cursor-pointer transition-all duration-150 ${
        variant === "primary"
          ? "bg-[#101828] text-white hover:bg-[#1c2b3f]"
          : "bg-white text-[#101828] border border-[#E5E7EB] hover:bg-gray-50"
      }`}
    >
      {label}
      <ArrowRight size={17} />
    </button>
  );
}
