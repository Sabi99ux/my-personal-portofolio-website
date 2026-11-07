import { BentoGrid } from '@/components/BentoGrid';
import { HeroMountain3D } from '@/components/HeroMountain3D';
import { ProjectShowcase } from '@/components/ProjectShowcase';
import { getProjectCards } from '@/lib/project-posts';

export default function HomePage() {
  const projects = getProjectCards();

  return (
    <main id="main">
      <HeroMountain3D />
      <ProjectShowcase projects={projects} />
      <BentoGrid />
    </main>
  );
}
