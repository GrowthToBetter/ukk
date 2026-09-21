import { Nav } from "@/components/interactive/nav";
import { Hero } from "@/components/scroll-scenes/hero";
import { StatsBar } from "@/components/sections/stats-bar";
import { CategoryShowcase } from "@/components/sections/category-showcase";
import { BigStatement } from "@/components/sections/big-statement";
import { HowItWorks } from "@/components/sections/how-it-works";
import { FinalCTA } from "@/components/sections/final-cta";

export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <StatsBar />
      <CategoryShowcase />
      <BigStatement />
      <HowItWorks />
      <FinalCTA />
    </main>
  );
}
