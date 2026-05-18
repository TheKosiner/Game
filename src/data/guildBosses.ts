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
  { id: 0, name: 'Nexus Destroyer',  emoji: '🤖', hp: 5_000_000,     xpReward: 15_000,    goldReward: 25_000,    description: 'Pierwsza AI strażnicza gildii. Kontroluje sektor sieciowy z żelazną precyzją.' },
  { id: 1, name: 'Omega Matrix',     emoji: '🌀', hp: 25_000_000,    xpReward: 50_000,    goldReward: 90_000,    description: 'Anomalia danych o zdolności samonaprawy. Niszczy infrastrukturę w sekundy.' },
  { id: 2, name: 'Void Titan',       emoji: '👾', hp: 100_000_000,   xpReward: 150_000,   goldReward: 275_000,   description: 'Koloss z innego wymiaru sieci. Pochłania dane i energię wszystkiego wokół.' },
  { id: 3, name: 'Digital God',      emoji: '⚡', hp: 400_000_000,   xpReward: 500_000,   goldReward: 900_000,   description: 'Cyfrowe bóstwo rządzące wirtualną przestrzenią. Prawie niepowstrzymany.' },
  { id: 4, name: 'Chaos Protocol',   emoji: '💀', hp: 1_500_000_000, xpReward: 1_750_000, goldReward: 3_000_000, description: 'Ostateczny protokół destrukcji stworzony by unicestwić samą sieć.' },
];
