export interface GuildBoss {
  id: number;
  name: string;
  emoji: string;
  hp: number;
  xpReward: number;
  goldReward: number;
  description: string;
}

export const GUILD_BOSSES: GuildBoss[] = [
  { id: 0, name: 'Nexus Destroyer',  emoji: '🤖', hp: 5_000_000,     xpReward: 7_500,    goldReward: 12_500,    description: 'Pierwsza AI strażnicza gildii. Kontroluje sektor sieciowy z żelazną precyzją.' },
  { id: 1, name: 'Omega Matrix',     emoji: '🌀', hp: 25_000_000,    xpReward: 25_000,   goldReward: 45_000,    description: 'Anomalia danych o zdolności samonaprawy. Niszczy infrastrukturę w sekundy.' },
  { id: 2, name: 'Void Titan',       emoji: '👾', hp: 100_000_000,   xpReward: 75_000,   goldReward: 137_500,   description: 'Koloss z innego wymiaru sieci. Pochłania dane i energię wszystkiego wokół.' },
  { id: 3, name: 'Digital God',      emoji: '⚡', hp: 400_000_000,   xpReward: 250_000,  goldReward: 450_000,   description: 'Cyfrowe bóstwo rządzące wirtualną przestrzenią. Prawie niepowstrzymany.' },
  { id: 4, name: 'Chaos Protocol',   emoji: '💀', hp: 1_500_000_000, xpReward: 875_000,  goldReward: 1_500_000, description: 'Ostateczny protokół destrukcji stworzony by unicestwić samą sieć.' },
];
