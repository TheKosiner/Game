export interface GuildBoss {
  id: number;
  name: string;
  emoji: string;
  hp: number;
  xpReward: number;
  goldReward: number;
  description: string;
  descriptionEn?: string;
}

export const GUILD_BOSSES: GuildBoss[] = [
  { id: 0, name: 'Nexus Destroyer',  emoji: '🤖', hp: 2_500_000,   xpReward: 7_500,    goldReward: 12_500,    description: 'Pierwsza AI strażnicza gildii. Kontroluje sektor sieciowy z żelazną precyzją.',       descriptionEn: 'The first AI guardian of the guild. Controls the network sector with iron precision.' },
  { id: 1, name: 'Omega Matrix',     emoji: '🌀', hp: 12_500_000,  xpReward: 25_000,   goldReward: 45_000,    description: 'Anomalia danych o zdolności samonaprawy. Niszczy infrastrukturę w sekundy.',            descriptionEn: 'A data anomaly with self-repair capabilities. Destroys infrastructure in seconds.' },
  { id: 2, name: 'Void Titan',       emoji: '👾', hp: 50_000_000,  xpReward: 75_000,   goldReward: 137_500,   description: 'Koloss z innego wymiaru sieci. Pochłania dane i energię wszystkiego wokół.',           descriptionEn: 'A colossus from another dimension of the network. Absorbs data and energy from everything around it.' },
  { id: 3, name: 'Digital God',      emoji: '⚡', hp: 200_000_000, xpReward: 250_000,  goldReward: 450_000,   description: 'Cyfrowe bóstwo rządzące wirtualną przestrzenią. Prawie niepowstrzymany.',              descriptionEn: 'A digital deity ruling virtual space. Nearly unstoppable.' },
  { id: 4, name: 'Chaos Protocol',   emoji: '💀', hp: 750_000_000, xpReward: 875_000,  goldReward: 1_500_000, description: 'Ostateczny protokół destrukcji stworzony by unicestwić samą sieć.',                  descriptionEn: 'The ultimate destruction protocol created to annihilate the network itself.' },
];
