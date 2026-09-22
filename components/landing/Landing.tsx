'use client';

import type { ReactNode } from 'react';
import { DrawerProvider, type DrawerItem } from './DrawerContext';
import { BookingDrawer } from './BookingDrawer';
import { Nav } from './Nav';
import { Hero, type HeroStay, type HeroTour } from './Hero';
import { TrustStrip, type Stats } from './TrustStrip';
import { Stays, type StayCard } from './Stays';
import { Contact } from './Contact';

/**
 * Client shell for the landing page.
 *
 * The page itself stays a server component and fetches everything; this only
 * holds the drawer state that Nav, Hero, Stays, the build scene and Tours all
 * need to open. Purely static sections (About, Footer) are passed through as
 * children so they keep rendering on the server.
 */
export function Landing({
  stays,
  tours,
  stats,
  projectTitle,
  bookItem,
  build,
  toursSection,
  about,
  footer,
}: {
  stays: StayCard[];
  tours: HeroTour[];
  stats: Stats;
  projectTitle: string | null;
  bookItem: DrawerItem | null;
  build: ReactNode;
  toursSection: ReactNode;
  about: ReactNode;
  footer: ReactNode;
}) {
  const heroStays: HeroStay[] = stays.filter((s) => s.listingMode !== 'sale');

  return (
    <DrawerProvider>
      <Nav bookItem={bookItem} />
      <main>
        <Hero stays={heroStays} tours={tours} projectTitle={projectTitle} />
        <TrustStrip stats={stats} />
        <Stays properties={stays} />
        {build}
        {toursSection}
        {about}
        <Contact />
      </main>
      {footer}
      <BookingDrawer />
    </DrawerProvider>
  );
}
