import type { ExplainerKind } from "./explainers";

interface ExplanationText {
  title: string;
  steps?: { label: string; title: string; text: string }[];
  notes?: { label: string; text: string }[];
}

export const explainersIt: Record<ExplainerKind, ExplanationText> = {
  "cheese-generation": {
    title: "Una frase nascosta in piena vista.",
    steps: [
      { label: "Scegli", title: "La profezia viene prima.", text: "Una frase viene scelta casualmente dalla raccolta dell’oracolo. In questo esempio: «Trust the path you cannot see» («Fidati del percorso che non puoi vedere»)." },
      { label: "Disperdi", title: "Le parole si confondono nella folla.", text: "Le parole della frase vengono inserite, in ordine di lettura, fra 120–159 parole di riempimento. Il testo continua a cambiare finché non si invoca l’oracolo." },
      { label: "Rivela", title: "I buchi rendono visibile una frase.", text: "Il testo si ferma. Una maschera SVG a forma di formaggio posiziona un buco su ogni parola cercata e rende leggibile la profezia." },
      { label: "Conserva", title: "Una lettura fugace diventa una carta.", text: "La frase rivelata può essere esportata in un PNG da 1080 × 1350 pixel, insieme alla composizione del formaggio e al codice QR del progetto." },
    ],
  },
  "cheese-revelation": {
    title: "La geometria dietro i buchi.",
    notes: [
      { label: "Posizione", text: "Ogni croce indica il centro di una parola cercata nel testo visualizzato." },
      { label: "Raggio", text: "Le dimensioni della parola determinano quelle del foro circolare." },
      { label: "Ordine di lettura", text: "Le parole cercate mantengono l’ordine della frase originale." },
      { label: "Maschera", text: "Questi cerchi diventano i buchi della maschera SVG a forma di formaggio." },
    ],
  },
  "cheese-interface": {
    title: "Un gesto. Due modi di leggerlo.",
    notes: [
      { label: "Invoca", text: "Un’unica azione ferma il campo di parole e rivela la maschera." },
      { label: "Rivela", text: "A sinistra, la frase appare attraverso i buchi del formaggio." },
      { label: "Leggi", text: "A destra, la stessa frase viene presentata in forma leggibile." },
      { label: "Conserva o ricomincia", text: "Salva la carta, oppure ricomincia con una nuova profezia." },
    ],
  },
  "dream-pipeline": {
    title: "Un ricordo diventa una costellazione.",
    steps: [
      { label: "Registra", title: "Ogni punto nasce da un sogno.", text: "L’archivio carica le schede strutturate da dreams.json. Ogni voce contiene un titolo, una data, attributi qualitativi e misure numeriche." },
      { label: "Confronta", title: "Un attributo scelto crea i collegamenti.", text: "I sogni vengono confrontati per umore, oggetti, ambientazione, persone o prospettiva. Un collegamento nasce quando condividono almeno un valore nella categoria selezionata." },
      { label: "Disponi", title: "Le relazioni danno forma alla mappa.", text: "Una simulazione di forze D3 bilancia attrazione, repulsione, centratura e collisioni. La metrica scelta determina il raggio di ogni nodo." },
      { label: "Esplora", title: "La mappa riporta alla singola scheda.", text: "Selezionare un nodo evidenzia i suoi vicini e apre i dettagli. La rete offre un percorso diverso dentro lo stesso archivio onirico." },
    ],
  },
  "dream-forces": {
    title: "I legami attraggono. I sogni trovano spazio.",
    notes: [
      { label: "Dimensione", text: "Raggio = 5 + metrica × 0,18. Scegli importanza, bizzarria o ricordo." },
      { label: "Attrazione", text: "Gli attributi condivisi creano legami che avvicinano i sogni collegati." },
      { label: "Separazione", text: "Repulsione e collisioni lasciano spazio attorno a ciascun sogno." },
      { label: "Equilibrio", text: "Centratura e forze radiali mantengono unita la costellazione." },
    ],
  },
  "dream-interface": {
    title: "Cambia prospettiva. Segui un sogno.",
    notes: [
      { label: "Contesto", text: "L’intestazione mostra il numero di voci e il selettore della lingua." },
      { label: "Filtro", text: "I filtri scelgono cosa collega i sogni e cosa ne determina le dimensioni." },
      { label: "Mappa", text: "Sposta e ingrandisci la mappa, poi seleziona un sogno per evidenziarne i vicini." },
      { label: "Scheda", text: "Il pannello dei dettagli mostra misure, attributi e collegamenti." },
    ],
  },
};
