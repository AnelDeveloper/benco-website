'use client';

import type { ReactNode } from 'react';
import { DrawerProvider, type DrawerItem } from './DrawerContext';
import { BookingDrawer } from './BookingDrawer';
import { Nav } from './Nav';

/**
 * The public site's frame: navigation, footer and the booking drawer.
 *
 * Sub-pages used to import the original Navbar and Footer, so following a
 * "Detalji" link jumped from the new design to the old one. Everything public
 * now renders inside this, which also means the drawer works from any page.
 *
 * `footer` comes in as a prop rather than being imported here so it can stay a
 * server component and keep reading its copy on the server.
 */
export function SiteShell({
  bookItem,
  footer,
  children,
}: {
  bookItem: DrawerItem | null;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <DrawerProvider>
      <Nav bookItem={bookItem} />
      <main className="min-h-screen bg-paper">{children}</main>
      {footer}
      <BookingDrawer />
    </DrawerProvider>
  );
}
