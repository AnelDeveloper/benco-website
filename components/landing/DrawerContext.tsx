'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type DrawerKind = 'stay' | 'offer' | 'offplan' | 'invest' | 'tour';

export type DrawerItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  pricePerNight?: number | null;
  price?: number | null;
  currency: string;
  maxGuests?: number | null;
  /** Off-plan and investment read these from the project. */
  pricePerM2?: number | null;
  minInvestment?: number | null;
  expectedReturnPercent?: number | null;
  availableUnits?: number | null;
  totalUnits?: number | null;
  /** Tours. */
  pricePerPerson?: number | null;
};

type DrawerState = { kind: DrawerKind; item: DrawerItem } | null;

type DrawerApi = {
  state: DrawerState;
  open: (kind: DrawerKind, item: DrawerItem) => void;
  close: () => void;
};

const Ctx = createContext<DrawerApi | null>(null);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrawerState>(null);

  return (
    <Ctx.Provider
      value={{
        state,
        open: (kind, item) => setState({ kind, item }),
        close: () => setState(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useDrawer(): DrawerApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useDrawer must be used inside <DrawerProvider>');
  return api;
}
