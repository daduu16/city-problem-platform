export interface CategorySeed {
  key: string;
  name: string;
  serviceOwner?: string;
  children?: CategorySeed[];
}

export const CATEGORY_TREE: CategorySeed[] = [
  {
    key: 'infrastructure',
    name: 'İnfrastruktur',
    children: [
      { key: 'facades', name: 'Fasad zədələnməsi' },
      { key: 'sidewalks', name: 'Səki problemləri' },
      { key: 'curbs', name: 'Kürsü problemləri' },
      { key: 'road_surface', name: 'Yol örtüyü zədələnməsi' },
      { key: 'asphalt_repair', name: 'Asfalt təmiri' },
    ],
  },
  {
    key: 'utilities',
    name: 'Kommunal xidmətlər',
    children: [
      { key: 'water', name: 'Su təchizatı', serviceOwner: 'azersu' },
      { key: 'gas', name: 'Qaz təchizatı', serviceOwner: 'azeriqaz' },
      { key: 'electricity', name: 'Elektrik təchizatı', serviceOwner: 'azerishiq' },
      { key: 'comm_lines', name: 'Kommunikasiya xətləri' },
    ],
  },
  {
    key: 'greenery',
    name: 'Yaşıllaşdırma və ekologiya',
    children: [
      { key: 'dry_zones', name: 'Quru yaşıllıq zonalar' },
      { key: 'tree_fall', name: 'Ağacın devrilməsi' },
      { key: 'mowing', name: 'Ot biçmə' },
    ],
  },
  {
    key: 'weather_emergency',
    name: 'Hava və fövqəladə hallar',
    children: [
      { key: 'floods', name: 'Su basması' },
      { key: 'ice', name: 'Buz və qar' },
      { key: 'storm_damage', name: 'Tufan nəticələri' },
    ],
  },
  {
    key: 'sanitation',
    name: 'Sanitariya və təmizlik',
    children: [
      { key: 'street_dirt', name: 'Küçə çirklənməsi' },
      { key: 'overflow_bins', name: 'Dolmuş zibil qutuları' },
    ],
  },
  {
    key: 'lighting',
    name: 'İşıqlandırma',
    children: [
      { key: 'broken_lamps', name: 'Nasaz işıq dirəkləri' },
      { key: 'dark_areas', name: 'Qaranlıq sahələr' },
    ],
  },
  {
    key: 'parks',
    name: 'Parklar və ictimai məkanlar',
    children: [
      { key: 'playgrounds', name: 'Uşaq meydançaları' },
      { key: 'benches', name: 'Skameykalar' },
      { key: 'fountains', name: 'Fountainlar' },
    ],
  },
  {
    key: 'advertising',
    name: 'Reklam və şəhər görünüşü',
    children: [
      { key: 'billboards', name: 'Reklam lövhələri' },
      { key: 'storefronts', name: 'Vitrinlər' },
      { key: 'fences', name: 'Tikinti hasarları' },
    ],
  },
];

/** Legacy enum → new category key mapping for demo incidents */
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  WATER: 'water',
  GAS: 'gas',
  ELECTRICITY: 'electricity',
  ROADS: 'road_surface',
  WASTE: 'street_dirt',
  LIGHTING: 'broken_lamps',
  OTHER: 'playgrounds',
};
