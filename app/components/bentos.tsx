import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { InputIcon } from "@radix-ui/react-icons";
import { FileTextIcon, Globe } from "lucide-react";
import { AnimatedBeamDemo } from "./Home/Beams";
import { InfiniteSliderBasic } from "./Home/Infinite";

const features = [
  {
    Icon: FileTextIcon,
    name: "1-on-1 Collaboration",
    description:
      "Direct editor-to-client workflow with simple project management and feedback.",
    href: "/",
    cta: "Learn more",
    background: (
      <div className="flex justify-center h-full items-center">
        <AnimatedBeamDemo />
      </div>
    ),
    className: "lg:col-span-1 lg:row-span-1",
  },
  {
    Icon: InputIcon,
    name: "Adobe Integration",
    description:
      "After Effects and Premiere Pro extensions for seamless workflow integration.",
    href: "/",
    cta: "Learn more",
    background: <InfiniteSliderBasic />,
    className: "lg:col-span-1 lg:row-span-1",
  },
  {
    Icon: Globe,
    name: "Client Revision Rounds",
    description:
      "Clients create new revision rounds with their feedback, keeping track of all changes.",
    href: "/",
    cta: "Learn more",
    background: (
      <video
        autoPlay
        loop
        muted
        src="/Loop Comp.mp4"
        className="absolute -top-20 opacity-60"
      />
    ),
    className: "lg:col-span-2 lg:row-span-1",
  },
];

export function BentoDemo() {
  return (
    <BentoGrid className="grid-cols-1 gap-4 lg:grid-cols-2">
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}
