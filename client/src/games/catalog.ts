export type GameEntry = {
  slug: string;
  name: string;
  blurb: string;
  status: 'live' | 'soon';
  players: string;
};

export const games: GameEntry[] = [
  {
    slug: 'quick-number',
    name: 'Quick Number',
    blurb: 'Find 1–50 on a messy board. First click wins the point.',
    status: 'live',
    players: '2 players',
  },
];
