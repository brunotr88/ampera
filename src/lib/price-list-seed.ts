/** Voci dimostrative tipo DEI Impianti Elettrici per popolare un listino vuoto. */

export type DemoEntry = {
  code: string; chapter: string; category: string; subCategory?: string;
  description: string; unit: string; unitPrice: number;
  materialCost?: number; laborCost?: number; laborHours?: number;
};

export const DEMO_PRICE_LIST_ENTRIES: DemoEntry[] = [
  // Cavi BT
  { code: "01.A02.001", chapter: "01", category: "Cavi BT", subCategory: "Unipolari", description: "Cavo unipolare FS17 450/750V H07V-K sez. 1,5 mmq, fornito e posato in tubazione predisposta", unit: "ml", unitPrice: 0.95, materialCost: 0.42, laborCost: 0.53, laborHours: 0.020 },
  { code: "01.A02.002", chapter: "01", category: "Cavi BT", subCategory: "Unipolari", description: "Cavo unipolare FS17 450/750V H07V-K sez. 2,5 mmq, fornito e posato", unit: "ml", unitPrice: 1.15, materialCost: 0.65, laborCost: 0.50, laborHours: 0.020 },
  { code: "01.A02.005", chapter: "01", category: "Cavi BT", subCategory: "Unipolari", description: "Cavo unipolare FS17 450/750V H07V-K sez. 6 mmq, fornito e posato", unit: "ml", unitPrice: 2.20, materialCost: 1.40, laborCost: 0.80, laborHours: 0.030 },
  { code: "01.A02.010", chapter: "01", category: "Cavi BT", subCategory: "Multipolari", description: "Cavo multipolare FG16OR16 0,6/1kV 3G2,5 mmq antifiamma LSZH, fornito e posato su canalina o tubazione", unit: "ml", unitPrice: 3.85, materialCost: 2.50, laborCost: 1.35, laborHours: 0.045 },
  { code: "01.A02.015", chapter: "01", category: "Cavi BT", subCategory: "Multipolari", description: "Cavo multipolare FG16OR16 5G2,5 mmq antifiamma LSZH, fornito e posato", unit: "ml", unitPrice: 5.20, materialCost: 3.50, laborCost: 1.70, laborHours: 0.055 },

  // Tubazioni e canaline
  { code: "02.B01.001", chapter: "02", category: "Tubazioni", subCategory: "PVC corrugato", description: "Tubazione corrugata in PVC autoestinguente diam. 20mm IP40, posata sotto traccia o a vista", unit: "ml", unitPrice: 2.45, materialCost: 0.85, laborCost: 1.60, laborHours: 0.060 },
  { code: "02.B01.005", chapter: "02", category: "Tubazioni", subCategory: "PVC corrugato", description: "Tubazione corrugata in PVC autoestinguente diam. 32mm IP40, posata", unit: "ml", unitPrice: 3.15, materialCost: 1.40, laborCost: 1.75, laborHours: 0.065 },
  { code: "02.B05.010", chapter: "02", category: "Canaline", subCategory: "PVC", description: "Canalina PVC 60x40mm portacavi con coperchio, fornita e posata a parete con tasselli ogni 50cm", unit: "ml", unitPrice: 8.90, materialCost: 3.20, laborCost: 5.70, laborHours: 0.200 },

  // Quadri elettrici
  { code: "03.C01.001", chapter: "03", category: "Quadri", subCategory: "Civili", description: "Centralino da incasso 36 moduli IP40 con portello fumè, fornito e posato compreso fissaggio scatola e collegamento", unit: "pz", unitPrice: 145.00, materialCost: 65.00, laborCost: 80.00, laborHours: 2.500 },
  { code: "03.C02.005", chapter: "03", category: "Quadri", subCategory: "Industriali", description: "Quadro elettrico stagno IP65 24 moduli con interruttore generale, fornito e installato a parete", unit: "pz", unitPrice: 295.00, materialCost: 145.00, laborCost: 150.00, laborHours: 3.500 },

  // Protezioni
  { code: "04.D01.001", chapter: "04", category: "Protezioni", subCategory: "Magnetotermici", description: "Interruttore magnetotermico 1P+N 16A 6kA curva C, fornito e installato in quadro", unit: "pz", unitPrice: 28.50, materialCost: 18.50, laborCost: 10.00, laborHours: 0.250 },
  { code: "04.D01.005", chapter: "04", category: "Protezioni", subCategory: "Magnetotermici", description: "Interruttore magnetotermico 4P 32A 10kA curva C, fornito e installato", unit: "pz", unitPrice: 95.00, materialCost: 75.00, laborCost: 20.00, laborHours: 0.500 },
  { code: "04.D02.001", chapter: "04", category: "Protezioni", subCategory: "Differenziali", description: "Interruttore differenziale puro 2P 40A 30mA tipo AC, fornito e installato", unit: "pz", unitPrice: 78.00, materialCost: 60.00, laborCost: 18.00, laborHours: 0.300 },
  { code: "04.D02.005", chapter: "04", category: "Protezioni", subCategory: "Differenziali", description: "Magnetotermico differenziale 2P 16A 30mA tipo A 6kA, fornito e installato", unit: "pz", unitPrice: 115.00, materialCost: 92.00, laborCost: 23.00, laborHours: 0.400 },

  // Apparecchi
  { code: "05.E01.001", chapter: "05", category: "Apparecchi", subCategory: "Civili", description: "Punto comando luce singolo, comprensivo di scatola incasso, tubazione, cavo, frutto e placca standard", unit: "pz", unitPrice: 35.00, materialCost: 12.50, laborCost: 22.50, laborHours: 0.800 },
  { code: "05.E01.005", chapter: "05", category: "Apparecchi", subCategory: "Civili", description: "Punto presa 10/16A bivalente, comprensivo di tutto il necessario per posa", unit: "pz", unitPrice: 42.00, materialCost: 15.00, laborCost: 27.00, laborHours: 0.900 },
  { code: "05.E02.001", chapter: "05", category: "Apparecchi", subCategory: "Industriali", description: "Presa CEE 16A 220V interbloccata IP44 da parete, fornita e installata", unit: "pz", unitPrice: 95.00, materialCost: 55.00, laborCost: 40.00, laborHours: 1.200 },

  // Illuminazione
  { code: "06.F01.001", chapter: "06", category: "Illuminazione", subCategory: "LED interna", description: "Plafoniera LED 36W 4000K 3600lm da soffitto, fornita e installata con collegamento", unit: "pz", unitPrice: 85.00, materialCost: 45.00, laborCost: 40.00, laborHours: 1.200 },
  { code: "06.F01.005", chapter: "06", category: "Illuminazione", subCategory: "LED interna", description: "Pannello LED 60x60 36W 4000K incassato in controsoffitto, fornito e installato", unit: "pz", unitPrice: 125.00, materialCost: 75.00, laborCost: 50.00, laborHours: 1.500 },
  { code: "06.F02.001", chapter: "06", category: "Illuminazione", subCategory: "Emergenza", description: "Plafoniera autonoma emergenza LED 11W 1h SE/SA, fornita e installata", unit: "pz", unitPrice: 145.00, materialCost: 95.00, laborCost: 50.00, laborHours: 1.500 },

  // Fotovoltaico
  { code: "07.G01.001", chapter: "07", category: "Fotovoltaico", subCategory: "Moduli", description: "Modulo fotovoltaico monocristallino 410Wp efficienza >21%, fornito e posato su struttura", unit: "pz", unitPrice: 285.00, materialCost: 195.00, laborCost: 90.00, laborHours: 2.500 },
  { code: "07.G02.001", chapter: "07", category: "Fotovoltaico", subCategory: "Inverter", description: "Inverter monofase 3,6kW con monitoraggio WiFi, fornito e installato con collegamenti CC e CA", unit: "pz", unitPrice: 1450.00, materialCost: 1050.00, laborCost: 400.00, laborHours: 10.000 },
  { code: "07.G03.001", chapter: "07", category: "Fotovoltaico", subCategory: "Accumulo", description: "Batteria al litio 5kWh integrabile, fornita e installata con collegamento all'inverter", unit: "pz", unitPrice: 3850.00, materialCost: 3150.00, laborCost: 700.00, laborHours: 16.000 },

  // Manodopera
  { code: "99.M01.001", chapter: "99", category: "Manodopera", subCategory: "Operai", description: "Operaio elettricista specializzato di 3° livello", unit: "h", unitPrice: 35.00, materialCost: 0, laborCost: 35.00, laborHours: 1.000 },
  { code: "99.M01.002", chapter: "99", category: "Manodopera", subCategory: "Operai", description: "Operaio elettricista qualificato di 2° livello", unit: "h", unitPrice: 30.00, materialCost: 0, laborCost: 30.00, laborHours: 1.000 },
  { code: "99.M01.003", chapter: "99", category: "Manodopera", subCategory: "Operai", description: "Operaio elettricista comune di 1° livello", unit: "h", unitPrice: 25.00, materialCost: 0, laborCost: 25.00, laborHours: 1.000 },
];
