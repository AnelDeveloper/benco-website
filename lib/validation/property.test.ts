import { describe, expect, it } from 'vitest';
import { parsePropertyForm, parseProjectForm, parseTourForm } from './property';

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

const validProperty = {
  title_bs: 'Vila sa jezerom',
  title_en: 'Lakeside villa',
  property_type: 'villa',
  listing_mode: 'sale',
  location: 'Sarajevo',
  price: '450000',
};

describe('parsePropertyForm', () => {
  it('accepts a valid sale listing', () => {
    const result = parsePropertyForm(form(validProperty));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.title_bs).toBe('Vila sa jezerom');
  });

  it('coerces numeric strings to numbers', () => {
    const result = parsePropertyForm(form({ ...validProperty, bedrooms: '4', area_m2: '320.5' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bedrooms).toBe(4);
      expect(result.data.area_m2).toBe(320.5);
    }
  });

  it('turns blank optional numbers into null rather than 0', () => {
    const result = parsePropertyForm(form({ ...validProperty, bedrooms: '' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.bedrooms).toBeNull();
  });

  it('rejects an empty Bosnian title', () => {
    const result = parsePropertyForm(form({ ...validProperty, title_bs: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.title_bs).toBeTruthy();
  });

  it('requires a sale price when the listing is for sale', () => {
    const result = parsePropertyForm(form({ ...validProperty, price: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.price).toBeTruthy();
  });

  it('requires a nightly price when the listing is for rent', () => {
    const result = parsePropertyForm(form({ ...validProperty, listing_mode: 'rent', price: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.price_per_night).toBeTruthy();
  });

  it('requires both prices when the listing is both', () => {
    const ok = parsePropertyForm(form({ ...validProperty, listing_mode: 'both', price_per_night: '200' }));
    expect(ok.ok).toBe(true);
    const missing = parsePropertyForm(form({ ...validProperty, listing_mode: 'both' }));
    expect(missing.ok).toBe(false);
  });

  it('rejects an unknown property type', () => {
    const result = parsePropertyForm(form({ ...validProperty, property_type: 'castle' }));
    expect(result.ok).toBe(false);
  });

  it('splits comma-separated features and drops blanks', () => {
    const result = parsePropertyForm(form({ ...validProperty, features: 'bazen, garaža , , vrt' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.features).toEqual(['bazen', 'garaža', 'vrt']);
  });

  it('reads checkboxes as booleans', () => {
    const on = parsePropertyForm(form({ ...validProperty, is_published: 'on' }));
    expect(on.ok && on.data.is_published).toBe(true);
    const off = parsePropertyForm(form(validProperty));
    expect(off.ok && off.data.is_published).toBe(false);
  });
});

const validProject = {
  title_bs: 'Stup',
  title_en: 'Stup',
  location: 'Sarajevo',
  status: 'under_construction',
  progress_percent: '45',
};

describe('parseProjectForm', () => {
  it('accepts a valid project', () => {
    expect(parseProjectForm(form(validProject)).ok).toBe(true);
  });

  it('rejects progress above 100', () => {
    const result = parseProjectForm(form({ ...validProject, progress_percent: '140' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.progress_percent).toBeTruthy();
  });

  it('rejects negative progress', () => {
    expect(parseProjectForm(form({ ...validProject, progress_percent: '-5' })).ok).toBe(false);
  });

  it('rejects an unknown status', () => {
    expect(parseProjectForm(form({ ...validProject, status: 'demolished' })).ok).toBe(false);
  });
});

const validTour = {
  title_bs: 'Jahorina',
  title_en: 'Jahorina',
  duration_hours: '8',
  distance_km: '60',
  price_per_person: '90',
};

describe('parseTourForm', () => {
  it('accepts a valid tour', () => {
    expect(parseTourForm(form(validTour)).ok).toBe(true);
  });

  it('defaults max seats to six', () => {
    const result = parseTourForm(form(validTour));
    expect(result.ok && result.data.max_seats).toBe(6);
  });

  it('rejects an empty title', () => {
    expect(parseTourForm(form({ ...validTour, title_bs: '' })).ok).toBe(false);
  });

  it('rejects more than twelve seats', () => {
    expect(parseTourForm(form({ ...validTour, max_seats: '20' })).ok).toBe(false);
  });

  it('coerces numeric strings', () => {
    const result = parseTourForm(form(validTour));
    expect(result.ok && result.data.duration_hours).toBe(8);
    expect(result.ok && result.data.price_per_person).toBe(90);
  });
});
