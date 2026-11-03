---
title: Georgios Zerdalis
summary: Portfolio for a timpanist, percussionist, and educator, with a motion-led one-scroll home.
status: live
order: 2
year: "2026"
role: Design and development
tags: [Astro, React, Framer Motion, Cloudflare Workers]
links:
  - { label: Visit site, href: "https://georgios-zerdalis.dimitri-meimaridis.workers.dev", kind: site }
  - { label: Source, href: "https://github.com/dmeim/georgios-zerdalis", kind: source }
cover: home
media:
  home:
    title: Home
    description: A dark concert-hall stage with champagne and steel accents.
    alt: Georgios Zerdalis homepage with a large name and portrait
  gallery:
    title: Gallery
    description: Photo collections fan out as decks and open into a grid. The idea behind this site's gallery.
    alt: Gallery page with photos and a fanned photo collection
  connect:
    title: Connect
    description: Contact details beside a form wired for an n8n webhook.
    alt: Connect page with contact details and a message form
  home-phone:
    title: Home on a phone
    alt: Georgios Zerdalis homepage at phone width
---

## The brief

George is a DMA candidate at the University of Miami Frost School of Music:
a timpanist, percussionist, and educator. He needed one place for
performances, teaching, and a way to get in touch, and it had to feel like
walking into a hall before a concert.

## The design

The "Midnight Concert Hall" system: a near-black ground, champagne and steel
accents, and three typefaces (Syne, Instrument Serif, and Manrope) used like a
programme booklet. The home page is a single scroll, with React islands and
Framer Motion choreographing each section as it enters.

## The build

- Astro 7, static output, served from Cloudflare Workers Static Assets.
- A gallery read from folders at build time: loose photos sit on their own and
  sub-folders become fanned decks.
- A connect form ready to post to an n8n webhook.
