export type Lang = 'en' | 'ms'

export const translations = {
  en: {
    brand: 'StrideMatch',
    navHome: 'Home',
    navAnalyze: 'Analyze',
    navCatalog: 'Catalog',
    navResults: 'Results',
    navShortlist: 'Shortlist',
    navHow: 'How it works',
    navStores: 'Stores (MY)',
    ctaFind: 'Find my shoes',
    footer:
      'Photo analysis runs in your browser. Profile & shortlist stay on this device.',
    heroEyebrow: 'Photo-powered shoe matching',
    heroTitle1: 'Find running shoes that actually fit',
    heroTitle2: ' your stride',
    heroLede:
      'Upload a foot photo, answer a few coach-style questions, and get ranked shoe recommendations with clear reasons — not hype. Built with Malaysia pricing (MYR) in mind.',
    startAnalysis: 'Start foot analysis',
    viewMatches: 'View my matches',
    retakeAnalysis: 'Retake analysis',
    browseCatalog: 'Browse catalog',
    howItWorks: 'How it works',
    langEn: 'EN',
    langMs: 'BM',
    storesTitle: 'Where to try shoes in Malaysia',
    storesLede:
      'Online matching is a starting point. For first-time buyers or anyone with pain, try shoes in person when you can.',
  },
  ms: {
    brand: 'StrideMatch',
    navHome: 'Laman utama',
    navAnalyze: 'Analisis',
    navCatalog: 'Katalog',
    navResults: 'Cadangan',
    navShortlist: 'Senarai',
    navHow: 'Cara ia berfungsi',
    navStores: 'Kedai (MY)',
    ctaFind: 'Cari kasut saya',
    footer:
      'Analisis foto dijalankan dalam pelayar anda. Profil & senarai disimpan pada peranti ini.',
    heroEyebrow: 'Padanan kasut berasaskan foto',
    heroTitle1: 'Cari kasut lari yang benar-benar sesuai',
    heroTitle2: ' dengan langkah anda',
    heroLede:
      'Muat naik foto kaki, jawab soalan ringkas, dan dapatkan cadangan kasut berperingkat dengan sebab yang jelas. Harga rujukan dalam MYR.',
    startAnalysis: 'Mula analisis kaki',
    viewMatches: 'Lihat cadangan saya',
    retakeAnalysis: 'Ulang analisis',
    browseCatalog: 'Lihat katalog',
    howItWorks: 'Cara ia berfungsi',
    langEn: 'EN',
    langMs: 'BM',
    storesTitle: 'Di mana cuba kasut di Malaysia',
    storesLede:
      'Padanan dalam talian hanyalah titik mula. Untuk pembeli baru atau jika ada sakit, cuba kasut di kedai bila boleh.',
  },
} as const

export type TranslationKey = keyof (typeof translations)['en']
