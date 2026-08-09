export const BUSINESS = {
  name: 'Batilux Sahel',
  phoneDisplay: '0770 54 58 97',
  phoneTel: '+213770545897',
  whatsapp: 'https://wa.me/213770545897',
  messenger: 'https://m.me/BATILUX',
  email: 'ets.tamsaouetelyes@hotmail.com',
  address: 'Ahnif centre, Wilaya de Bouira, Algérie',
  facebook: 'https://www.facebook.com/BATILUX',
  instagram: 'https://www.instagram.com/batilux',
  tiktok: 'https://www.tiktok.com/@batiluxsahel',
  mapEmbed:
    'https://www.google.com/maps?q=Ahnif+Centre,+Bouira,+Algeria&output=embed',
  hours: [
    { days: 'Samedi — Jeudi', time: '08h30 – 18h30' },
    { days: 'Vendredi', time: 'Fermé' },
  ],
}

export const NAV_LINKS = [
  { href: '#apropos', label: 'À propos' },
  { href: '#categories', label: 'Produits' },
  { href: '#gros-detail', label: 'Gros & détail' },
  { href: '#galerie', label: 'Galerie' },
  { href: '#localisation', label: 'Où nous trouver' },
  { href: '#contact', label: 'Contact' },
]

// Each category gets a distinct texture treatment — deliberately not identical cards.
export const CATEGORIES = [
  {
    id: 'peinture',
    label: 'Peinture & revêtement mural',
    ref: 'PMT–01',
    description:
      "Peintures techniques, enduits décoratifs et revêtements muraux pour l'intérieur — mats, satinés, texturés.",
    texture: 'brush',
  },
  {
    id: 'sol',
    label: 'Revêtement de sol',
    ref: 'SOL–02',
    description:
      'Résines, dalles et revêtements de sol adaptés aux pièces de vie comme aux zones à fort passage.',
    texture: 'tile',
  },
  {
    id: 'facade',
    label: 'Extérieur & façade',
    ref: 'FAC–03',
    description:
      "Enduits de façade, imperméabilisants et finitions extérieures pensés pour le climat de la région.",
    texture: 'stucco',
  },
  {
    id: 'deco',
    label: 'Décoration',
    ref: 'DEC–04',
    description:
      "Accessoires et produits de décoration intérieure pour finaliser un chantier ou une rénovation.",
    texture: 'dot',
  },
]

export const GALLERY_PLACEHOLDERS = [
  { id: 1, label: 'Nuancier peinture technique', tone: 'sage' },
  { id: 2, label: 'Chantier façade — Bouira', tone: 'clay' },
  { id: 3, label: 'Revêtement de sol posé', tone: 'stone' },
  { id: 4, label: 'Enduit décoratif mural', tone: 'sage' },
  { id: 5, label: "Rayon détail — magasin Ahnif", tone: 'clay' },
  { id: 6, label: 'Finition extérieure', tone: 'stone' },
]
