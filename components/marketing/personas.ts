// Avatares estáveis pra mocks da landing, via pravatar.cc.
// Cada IDs gera o mesmo rosto, então a persona fica consistente entre seções.

export const PERSONAS = {
  marina: {
    name: "Marina Vieira",
    short: "Marina",
    role: "Voluntária no Resgate Patinhas",
    avatar: "https://i.pravatar.cc/120?img=47",
  },
  rafael: {
    name: "Rafael Mendes",
    short: "Rafael",
    role: "Pai do João Pedro",
    avatar: "https://i.pravatar.cc/120?img=11",
  },
  ana: {
    name: "Ana Costa",
    short: "Ana",
    avatar: "https://i.pravatar.cc/120?img=44",
  },
  joao: {
    name: "João Santos",
    short: "João",
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  maria: {
    name: "Maria Silva",
    short: "Maria",
    avatar: "https://i.pravatar.cc/120?img=5",
  },
  pedro: {
    name: "Pedro Lima",
    short: "Pedro",
    avatar: "https://i.pravatar.cc/120?img=33",
  },
  carla: {
    name: "Carla Souza",
    short: "Carla",
    avatar: "https://i.pravatar.cc/120?img=49",
  },
  ong: {
    name: "ONG Mãos que Cuidam",
    short: "Mãos que Cuidam",
    role: "Organização social",
    // ONG sem rosto — mantém gradient inicial
    avatar: undefined as string | undefined,
  },
} as const;

// Foto ilustrativa pro card de campanha "Castração de 22 gatos"
export const CAMPAIGN_HERO_IMAGE =
  "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=900&q=80&auto=format&fit=crop";
// Backup de gato fofinho caso precise:
// https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=900&q=80&auto=format&fit=crop
