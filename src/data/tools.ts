export interface Tool {
  id: string;
  name: string;
  category: {
    en: string;
    it: string;
  };
  description: {
    en: string;
    it: string;
  };
  tags: string[];
  githubUrl?: string;
  webUrl?: string;
  docsUrl?: string;
  featured?: boolean;
  badge?: {
    en: string;
    it: string;
  };
}

export const tools: Tool[] = [
  {
    id: "cobalt",
    name: "Cobalt",
    category: {
      en: "Media & Download",
      it: "Media & Download"
    },
    description: {
      en: "Save and download video, audio, and images from YouTube, Instagram, TikTok, Twitter/X, Reddit, SoundCloud, and 30+ platforms without ads, trackers, or watermarks.",
      it: "Salva e scarica video, audio e immagini da YouTube, Instagram, TikTok, Twitter/X, Reddit, SoundCloud e oltre 30 piattaforme senza pubblicità, tracker o watermark."
    },
    tags: ["YouTube", "Downloader", "Open Source", "Media", "Privacy"],
    githubUrl: "https://github.com/imputnet/cobalt",
    webUrl: "https://cobalt.tools",
    docsUrl: "https://github.com/imputnet/cobalt/tree/main/docs",
    featured: true,
    badge: {
      en: "Active Utility",
      it: "Strumento Attivo"
    }
  }
];
