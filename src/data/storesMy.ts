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
    id: 'kuching-city-sports',
    city: 'Kuching',
    state: 'Sarawak',
    name: 'City / mall sports retailers (Boulevard, Vivacity, The Spring)',
    type: 'mall',
    notes:
      'Good for trying common Nike, adidas, ASICS, and New Balance models. Ask staff for a short treadmill or hallway jog if available.',
    notesMs:
      'Sesuai untuk cuba model Nike, adidas, ASICS dan New Balance yang biasa. Minta staf benarkan anda berlari sebentar jika ada treadmill.',
    mapQuery: 'sports shoe store Kuching Sarawak',
  },
  {
    id: 'kuching-specialty',
    city: 'Kuching',
    state: 'Sarawak',
    name: 'Local multi-brand sports shops',
    type: 'specialty',
    notes:
      'Search for independent running/outdoor shops in Kuching for gait advice and trail options (HOKA, Salomon, etc.). Call ahead for stock.',
    notesMs:
      'Cari kedai sukan/outdoor di Kuching untuk nasihat gaya lari dan pilihan trail. Telefon dulu untuk stok.',
    mapQuery: 'running shoe store Kuching',
  },
  {
    id: 'kl-specialty',
    city: 'Kuala Lumpur',
    state: 'WP Kuala Lumpur',
    name: 'Specialty running stores (KL / PJ)',
    type: 'specialty',
    notes:
      'KL and Petaling Jaya have dedicated running shops that often offer gait checks, brand days, and wider trail/race ranges.',
    notesMs:
      'KL dan Petaling Jaya ada kedai lari khusus yang kerap tawarkan semakan gait, hari jenama, dan pilihan trail/lumba yang lebih luas.',
    mapQuery: 'specialty running store Kuala Lumpur',
  },
  {
    id: 'kl-mall',
    city: 'Kuala Lumpur',
    state: 'WP Kuala Lumpur',
    name: 'Brand concept stores & large malls',
    type: 'brand',
    notes:
      'Nike, adidas, ASICS, HOKA, and New Balance flagship or concept stores in major malls (TRX, Pavilion, Mid Valley, 1U, IOI) for fit and latest colourways.',
    notesMs:
      'Kedai konsep Nike, adidas, ASICS, HOKA dan New Balance di pusat beli-belah utama untuk padanan saiz dan warna terkini.',
    mapQuery: 'Nike adidas ASICS store Kuala Lumpur mall',
  },
  {
    id: 'online-my',
    city: 'Malaysia',
    state: 'Nationwide',
    name: 'Online (Lazada, Shopee, brand sites)',
    type: 'online',
    notes:
      'Convenient for known sizes. Prefer sellers with easy returns. Match the model name from StrideMatch, then verify drop/weight on the product page.',
    notesMs:
      'Sesuai jika anda sudah tahu saiz. Pilih penjual dengan pulangan mudah. Padankan nama model dari StrideMatch, lalu semak drop/berat di halaman produk.',
    mapQuery: 'running shoes Malaysia',
  },
]
