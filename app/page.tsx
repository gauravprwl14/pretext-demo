import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import ComparisonSection from "@/components/ComparisonSection";
import KineticSection from "@/components/KineticSection";
import TechExplainerSection from "@/components/TechExplainerSection";
import PlaygroundSection from "@/components/PlaygroundSection";
import AdvancedShowcaseSection from "@/components/AdvancedShowcaseSection";
import ChatBubblesSection from "@/components/ChatBubblesSection";
import MasonrySection from "@/components/MasonrySection";
import MagazineSection from "@/components/MagazineSection";
import PerformanceSection from "@/components/PerformanceSection";
import AboutSection from "@/components/AboutSection";
import TypographicsPhysicsSection from "@/components/TypographicsPhysicsSection";
import PredictiveGhostSection from "@/components/PredictiveGhostSection";
import SeismographSection from "@/components/SeismographSection";
import TextTerrainSection from "@/components/TextTerrainSection";
import PrecisionScrollSection from "@/components/PrecisionScrollSection";
import ExperimentLeaderboardSection from "@/components/ExperimentLeaderboardSection";

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <NavBar />

      {/* 1. Hero — interactive mouse demo, what pretext is */}
      <HeroSection />

      {/* 2. Comparison — DOM vs Pretext, visceral side-by-side */}
      <div id="comparison">
        <ComparisonSection />
      </div>

      {/* 3. Kinetic — creative canvas animations powered by pretext positions */}
      <div id="kinetic">
        <KineticSection />
      </div>

      {/* 4. Under the Hood — Quick Start + architecture for developers */}
      <div id="how-it-works">
        <TechExplainerSection />
      </div>

      {/* 5. Playground — measure text interactively, cursor-controlled */}
      <div id="playground">
        <PlaygroundSection />
      </div>

      {/* 6. Advanced Showcase — real production patterns (CLS, skeleton, labels…) */}
      <div id="advanced">
        <AdvancedShowcaseSection />
      </div>

      {/* 7. Chat Bubbles — practical pretext demo */}
      <div id="chat">
        <ChatBubblesSection />
      </div>

      {/* 8. Masonry — virtual scroll with pre-measured heights */}
      <div id="masonry">
        <MasonrySection />
      </div>

      {/* 9. Magazine — responsive multi-column layout */}
      <div id="magazine">
        <MagazineSection />
      </div>

      {/* 10. Performance benchmark */}
      <div id="performance">
        <PerformanceSection />
      </div>

      {/* 11. Predictive Ghost Layout — what was impossible before */}
      <div id="ghost">
        <PredictiveGhostSection />
      </div>

      {/* 12. Typography Physics — sandbox experiment */}
      <div id="physics">
        <TypographicsPhysicsSection />
      </div>

      {/* 13. Seismograph — text DNA as waveform */}
      <div id="seismograph">
        <SeismographSection />
      </div>

      {/* 14. Text as Terrain — platformer game powered by pretext word widths */}
      <div id="terrain">
        <TextTerrainSection />
      </div>

      {/* 15. Precision Scroll — 10,000 items, pre-computed heights, zero DOM measurement */}
      <div id="precision-scroll">
        <PrecisionScrollSection />
      </div>

      {/* 16. Experiment Leaderboard — rated demos + winning prompt formula */}
      <div id="experiments">
        <ExperimentLeaderboardSection />
      </div>

      {/* About + install */}
      <div id="about">
        <AboutSection />
      </div>
    </main>
  );
}
