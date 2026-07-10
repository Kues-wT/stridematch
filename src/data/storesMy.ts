export interface StoreTip {
  id: string
  city: string
  state: string
  name: string
  type: 'specialty' | 'mall' | 'brand' | 'online'
  notes: string
  notesMs: string
  mapQuery: string
}

/** Practical starting points for trying running shoes in Malaysia (not sponsored). */
export const storesMy: StoreTip[] = [
  {
    id: 'kk-malls',
    city: 'Kota Kinabalu',
    state: 'Sabah',
    name: 'Imago, Suria Sabah, Centre Point & 1Borneo sports retailers',
    type: 'mall',
    notes:
      'Best first stop in KK for Nike, adidas, ASICS, New Balance and other mainstream trainers. Ask staff if you can walk or jog a short loop to check fit.',
    notesMs:
      'Tempat mula terbaik di KK untuk Nike, adidas, ASICS, New Balance dan model popular lain. Minta staf benarkan anda berjalan atau berlari sebentar untuk semak padanan.',
    mapQuery: 'sports shoe store Kota Kinabalu Imago Suria Sabah',
  },
  {
    id: 'kk-specialty',
    city: 'Kota Kinabalu',
    state: 'Sabah',
    name: 'Local multi-brand & outdoor shops',
    type: 'specialty',
    notes:
      'Look for independent sports and outdoor shops around KK for trail options (HOKA, Salomon, etc.) and more personal fitting advice. Call ahead for stock of specific models.',
    notesMs:
      'Cari kedai sukan/outdoor di sekitar KK untuk pilihan trail (HOKA, Salomon, dll.) dan nasihat padanan. Telefon dulu untuk stok model tertentu.',
    mapQuery: 'running outdoor shoe store Kota Kinabalu',
  },
  {
    id: 'kk-trails',
    city: 'Kota Kinabalu',
    state: 'Sabah',
    name: 'Trail & hiking gear shops',
    type: 'specialty',
    notes:
      'If you run Signal Hill, KK City trails, or head toward Crocker Range / Kinabalu foothills, prioritise shops that stock trail shoes with real grip — not only road trainers.',
    notesMs:
      'Jika anda berlari di Signal Hill, trail bandar KK, atau ke arah Crocker Range / kaki Kinabalu, pilih kedai yang stok kasut trail dengan cengkaman sebenar.',
    mapQuery: 'trail hiking shoes Kota Kinabalu',
  },
  {
    id: 'kl-specialty',
    city: 'Kuala Lumpur',
    state: 'WP Kuala Lumpur',
    name: 'Specialty running stores (KL / PJ)',
    type: 'specialty',
    notes:
      'KL and Petaling Jaya have dedicated running shops with wider race/trail ranges and occasional gait events — useful if you visit Peninsula.',
    notesMs:
      'KL dan Petaling Jaya ada kedai lari khusus dengan pilihan trail/lumba yang lebih luas — berguna jika anda ke Semenanjung.',
    mapQuery: 'specialty running store Kuala Lumpur',
  },
  {
    id: 'online-my',
    city: 'Malaysia',
    state: 'Nationwide',
    name: 'Online (Shopee, Lazada, brand sites)',
    type: 'online',
    notes:
      'Handy once you know your size. Prefer sellers with easy returns. Search the exact model name from StrideMatch, then check colourway and size chart.',
    notesMs:
      'Sesuai jika anda sudah tahu saiz. Pilih penjual dengan pulangan mudah. Cari nama model tepat dari StrideMatch, lalu semak warna dan carta saiz.',
    mapQuery: 'running shoes Shopee Lazada Malaysia',
  },
]
