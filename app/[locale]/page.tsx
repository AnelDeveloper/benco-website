import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Properties } from '@/components/Properties';
import { InvestBuild } from '@/components/InvestBuild';
import { About } from '@/components/About';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';

// Re-fetch properties from the database at most every 5 minutes.
export const revalidate = 300;

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Properties />
      <InvestBuild />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}
