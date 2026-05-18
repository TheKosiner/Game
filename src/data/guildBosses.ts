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
  { id: 0, name: 'Nexus Destroyer',  emoji: '🤖', hp: 1_000_000,   xpReward: 3_000,   goldReward: 5_000,   description: 'Pierwsza AI strażnicza gildii. Kontroluje sektor sieciowy z żelazną precyzją.' },
  { id: 1, name: 'Omega Matrix',     emoji: '🌀', hp: 5_000_000,   xpReward: 10_000,  goldReward: 18_000,  description: 'Anomalia danych o zdolności samonaprawy. Niszczy infrastrukturę w sekundy.' },
  { id: 2, name: 'Void Titan',       emoji: '👾', hp: 20_000_000,  xpReward: 30_000,  goldReward: 55_000,  description: 'Koloss z innego wymiaru sieci. Pochłania dane i energię wszystkiego wokół.' },
  { id: 3, name: 'Digital God',      emoji: '⚡', hp: 80_000_000,  xpReward: 100_000, goldReward: 180_000, description: 'Cyfrowe bóstwo rządzące wirtualną przestrzenią. Prawie niepowstrzymany.' },
  { id: 4, name: 'Chaos Protocol',   emoji: '💀', hp: 300_000_000, xpReward: 350_000, goldReward: 600_000, description: 'Ostateczny protokół destrukcji stworzony by unicestwić samą sieć.' },
];
