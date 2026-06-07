import svgPaths from "./svg-kd82b58p62";

function Op() {
  return (
    <div className="h-[16.401px] relative shrink-0 w-[20.502px]" data-name="Op">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.5018 16.4014">
        <g clipPath="url(#clip0_24_39)" id="Op">
          <path d={svgPaths.pfc8bc00} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p2c9417f2} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.pfc8bc00} fill="var(--fill-0, white)" id="Vector_3" />
          <path d={svgPaths.p2c9417f2} fill="var(--fill-0, white)" id="Vector_4" />
        </g>
        <defs>
          <clipPath id="clip0_24_39">
            <rect fill="white" height="16.4014" width="20.5018" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#101828] content-stretch flex items-center justify-center px-[9.58px] relative rounded-[8px] shrink-0 size-[38.312px]" data-name="Container">
      <Op />
    </div>
  );
}

function Text() {
  return (
    <div className="h-[33.506px] relative shrink-0 w-[129.417px]" data-name="Text">
      <p className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[33.506px] left-0 not-italic text-[#101828] text-[22.338px] top-[7.97px] tracking-[-0.7958px] whitespace-nowrap">VisionStudio</p>
    </div>
  );
}

export default function Logo() {
  return (
    <div className="content-stretch flex gap-[14.892px] items-center relative size-full" data-name="Logo">
      <Container />
      <Text />
    </div>
  );
}