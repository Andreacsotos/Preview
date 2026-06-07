import svgPaths from "./svg-oh5z1uvz1o";

function Sombra() {
  return <div className="absolute bg-[#e5e7eb] border-[#d1d5dc] border-[1.071px] border-solid h-[278.427px] left-[21px] opacity-40 rounded-[22.275px] top-[43px] w-[534.59px]" data-name="Sombra" />;
}

function Container() {
  return <div className="absolute bg-[#d1d5dc] left-[27.84px] rounded-[17966860px] size-[11.136px] top-[27.84px]" data-name="Container" />;
}

function Container1() {
  return <div className="absolute bg-[#f3f4f6] h-[11.136px] left-[50.11px] rounded-[17966860px] top-[27.84px] w-[133.646px]" data-name="Container" />;
}

function Container2() {
  return <div className="absolute bg-[#f3f4f6] h-[11.136px] left-[437.79px] rounded-[17966860px] top-[27.84px] w-[66.823px]" data-name="Container" />;
}

function Container3() {
  return <div className="absolute bg-[#f9fafb] border-[#f3f4f6] border-[1.071px] border-solid h-[72.386px] left-[27.84px] rounded-[13.922px] top-[61.24px] w-[151.499px]" data-name="Container" />;
}

function Container4() {
  return <div className="absolute bg-[#f9fafb] border-[#f3f4f6] border-[1.071px] border-solid h-[72.386px] left-[190.47px] rounded-[13.922px] top-[61.24px] w-[151.499px]" data-name="Container" />;
}

function Container5() {
  return <div className="absolute bg-[#f9fafb] border-[#f3f4f6] border-[1.071px] border-solid h-[72.386px] left-[353.11px] rounded-[13.922px] top-[61.24px] w-[151.508px]" data-name="Container" />;
}

function Container6() {
  return <div className="absolute bg-[#f9fafb] border-[#f3f4f6] border-[1.071px] border-solid h-[72.386px] left-[27.84px] rounded-[13.922px] top-[144.76px] w-[151.499px]" data-name="Container" />;
}

function Container7() {
  return <div className="absolute bg-[#f9fafb] border-[#f3f4f6] border-[1.071px] border-solid h-[72.386px] left-[190.47px] rounded-[13.922px] top-[144.76px] w-[151.499px]" data-name="Container" />;
}

function Container8() {
  return <div className="absolute bg-[#f9fafb] border-[#f3f4f6] border-[1.071px] border-solid h-[72.386px] left-[353.11px] rounded-[13.922px] top-[144.76px] w-[151.508px]" data-name="Container" />;
}

function Container9() {
  return <div className="absolute bg-[#f3f4f6] h-[8.35px] left-[27.84px] rounded-[17966860px] top-[233.85px] w-[476.778px]" data-name="Container" />;
}

function Container11() {
  return <div className="bg-[#e5e7eb] h-[11.136px] relative rounded-[17966860px] shrink-0 w-[89.094px]" data-name="Container" />;
}

function Container10() {
  return (
    <div className="absolute bg-[#f9fafb] content-stretch flex h-[55.679px] items-center left-0 pl-[27.835px] pr-[27.844px] pt-[1.071px] top-[248.45px] w-[532.449px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#f3f4f6] border-solid border-t-[1.071px] inset-0 pointer-events-none" />
      <Container11 />
    </div>
  );
}

function Superior() {
  return (
    <div className="absolute bg-white border-[#e5e7eb] border-[1.071px] border-solid h-[306.27px] left-[0.57px] overflow-clip rounded-[22.275px] shadow-[0px_1.392px_4.177px_0px_rgba(0,0,0,0.1),0px_1.392px_2.784px_-1.392px_rgba(0,0,0,0.1)] top-[0.17px] w-[534.59px]" data-name="Superior">
      <Container />
      <Container1 />
      <Container2 />
      <Container3 />
      <Container4 />
      <Container5 />
      <Container6 />
      <Container7 />
      <Container8 />
      <Container9 />
      <Container10 />
    </div>
  );
}

function Recuadro() {
  return (
    <div className="absolute h-[322px] left-[21.99px] top-[22.17px] w-[556px]" data-name="Recuadro">
      <Sombra />
      <Superior />
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[15.311px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.3106 15.3106">
        <g id="Icon">
          <path d={svgPaths.p30a87380} id="Vector" stroke="var(--stroke-0, #6A7282)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.27588" />
        </g>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="h-[22.275px] relative shrink-0 w-[115.551px]" data-name="Text">
      <p className="[word-break:break-word] absolute font-['Inter:Medium',sans-serif] font-medium leading-[22.971px] left-[-0.17px] not-italic text-[#364153] text-[15.314px] top-[0.46px] tracking-[0.0897px] whitespace-nowrap">Auto-organized</p>
    </div>
  );
}

function Auto() {
  return (
    <div className="absolute bg-white content-stretch drop-shadow-[0px_1.392px_2.088px_rgba(0,0,0,0.1),0px_1.392px_1.392px_rgba(0,0,0,0.1)] flex gap-[11px] items-center left-[401.38px] px-[18px] py-[13px] rounded-[40px] top-0" data-name="Auto">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[1.071px] border-solid inset-0 pointer-events-none rounded-[40px]" />
      <Icon />
      <Text />
    </div>
  );
}

function Container12() {
  return <div className="bg-[#99a1af] relative rounded-[17966860px] shrink-0 size-[8.353px]" data-name="Container" />;
}

function Text1() {
  return (
    <div className="h-[22.275px] relative shrink-0 w-[140.61px]" data-name="Text">
      <p className="[word-break:break-word] absolute font-['Inter:Medium',sans-serif] font-medium leading-[22.971px] left-[-0.04px] not-italic text-[#4a5565] text-[15.314px] top-[0.46px] tracking-[0.0897px] whitespace-nowrap">12 assets detected</p>
    </div>
  );
}

function Assets() {
  return (
    <div className="absolute bg-white content-stretch drop-shadow-[0px_1.392px_2.088px_rgba(0,0,0,0.1),0px_1.392px_1.392px_rgba(0,0,0,0.1)] flex gap-[11px] items-center left-0 px-[18px] py-[13px] rounded-[40px] top-[309.03px]" data-name="Assets">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[1.071px] border-solid inset-0 pointer-events-none rounded-[40px]" />
      <Container12 />
      <Text1 />
    </div>
  );
}

export default function Mockup() {
  return (
    <div className="relative size-full" data-name="Mockup">
      <Recuadro />
      <Auto />
      <Assets />
    </div>
  );
}