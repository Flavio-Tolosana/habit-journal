import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DiarySlides from '../../../src/lib/components/DiarySlides.svelte';
import type { DiarySlide } from '../../../src/lib/utils/diary';

const slides: DiarySlide[] = [
  {
    date: '2026-09-01',
    journalText: 'Hoy fue un gran día en la montaña.',
    mantra: 'Mi mantra del mes',
    completions: { leer: true, correr: false },
  },
  {
    date: '2026-08-25',
    journalText: 'Día tranquilo en casa.',
    mantra: 'Mi mantra del mes',
    completions: { leer: true },
  },
];

const habits = [
  { id: 'leer', name: 'Leer' },
  { id: 'correr', name: 'Correr' },
];

describe('DiarySlides rendering', () => {
  it('renders one slide per entry with its date and journal text', () => {
    render(DiarySlides, { props: { slides, habits } });

    expect(screen.getByText('Hoy fue un gran día en la montaña.')).toBeTruthy();
    expect(screen.getByText('Día tranquilo en casa.')).toBeTruthy();
    expect(screen.getByLabelText('1 septiembre 2026')).toBeTruthy();
    expect(screen.getByLabelText('25 agosto 2026')).toBeTruthy();
  });

  it('renders the month mantra on each slide', () => {
    render(DiarySlides, { props: { slides, habits } });

    expect(screen.getAllByText('Mi mantra del mes')).toHaveLength(2);
  });
});

describe('DiarySlides habit reveal (progressive disclosure, FR-019)', () => {
  it('hides habit checkmarks by default', () => {
    render(DiarySlides, { props: { slides, habits } });

    expect(screen.queryByLabelText('Leer')).toBeNull();
    expect(screen.queryByLabelText('Correr')).toBeNull();
  });

  it('reveals the day habits when the toggle is pressed and hides them again', async () => {
    render(DiarySlides, { props: { slides, habits } });

    const toggle = screen.getAllByRole('button', { name: 'Mostrar hábitos' })[0];
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    await fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const leer = screen.getByLabelText('Leer') as HTMLInputElement;
    expect(leer.checked).toBe(true);
    const correr = screen.getByLabelText('Correr') as HTMLInputElement;
    expect(correr.checked).toBe(false);
    expect(correr.disabled).toBe(true);
  });
});

describe('DiarySlides boundary indicators (FR-009)', () => {
  it('shows an edge hint at each scroll boundary', async () => {
    const { container } = render(DiarySlides, { props: { slides, habits } });

    expect(container.querySelector('[data-edge="left"]')).toBeTruthy();
    expect(container.querySelector('[data-edge="right"]')).toBeNull();

    const options = screen.getAllByRole('option');
    options[0].focus();
    await fireEvent.keyDown(options[0], { key: 'ArrowLeft' });

    expect(container.querySelector('[data-edge="right"]')).toBeTruthy();
    expect(container.querySelector('[data-edge="left"]')).toBeNull();
  });
});

describe('DiarySlides keyboard navigation (FR-015)', () => {
  it('moves to the older day with ArrowLeft and back with ArrowRight', async () => {
    render(DiarySlides, { props: { slides, habits } });

    const options = screen.getAllByRole('option');
    expect(slides).toHaveLength(2);

    options[0].focus();
    await fireEvent.keyDown(options[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(options[1]);

    await fireEvent.keyDown(options[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(options[0]);
  });

  it('stays at the boundaries without moving beyond the slides', async () => {
    render(DiarySlides, { props: { slides, habits } });

    const options = screen.getAllByRole('option');

    options[0].focus();
    await fireEvent.keyDown(options[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(options[0]);

    options[1].focus();
    await fireEvent.keyDown(options[1], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(options[1]);
  });
});