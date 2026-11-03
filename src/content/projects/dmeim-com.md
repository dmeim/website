---
title: dmeim.com
summary: Personal platform for projects, keys and everyday tools, built static-first on Cloudflare.
status: wip
order: 1
year: 2025–present
role: Design and development
tags: [Astro, TypeScript, Cloudflare Workers, Plain CSS]
links:
  - { label: Visit site, href: "https://dmeim.com", kind: site }
  - { label: Source, href: "https://github.com/dmeim/website", kind: source }
cover: home
media:
  home:
    title: Home
    description: The identity block and the Now section. Flat, quiet and laid out like a CV.
    alt: dmeim.com homepage with a portrait, name, contact icons and a Now section
  gallery:
    title: Gallery
    description: Albums as fanned stacks; each opens its own page with a preview box.
    alt: Gallery page showing two album stacks
  tools:
    title: Tools
    description: Local-first utilities, from encoders to diff viewers, all running in the browser.
    alt: Tools workspace with a sidebar of tools and a tool open
  orthodox:
    title: Orthodox
    description: The landing page for a full-screen icon wall meant for a spare tablet or TV.
    alt: Orthodox landing page describing the icon screensaver
  ui:
    title: UI library
    description: The /ui showcase renders every component in both themes, Astro and React side by side.
    alt: UI library showcase page with buttons, inputs and badges
  home-phone:
    title: Home on a phone
    description: Menu on the left opens a drawer; the identity block stays at the top.
    alt: dmeim.com homepage at phone width
---

## What it is

The home base for everything I make and publish: projects, public keys, a
gallery, and a growing set of tools that run entirely in the browser. It is
deliberately quiet. Colour, spacing and hairlines carry the hierarchy, and
gold is saved for links, focus and the marker that glides to the current page.

## How it's built

- **Static first.** Astro 7 renders every page at build time and Cloudflare
  Workers Static Assets serves them. Only the private chat runs server-side.
- **One UI library.** About 70 components share a single token contract, in
  both Astro and React, so tools, chat and content pages look like one site.
- **Images at build time.** Photos are resized to WebP once during the build,
  so there are no per-request image transforms to pay for.
- **No framework CSS.** Plain CSS with custom properties, light and dark
  themes, and a reduced-motion mode that turns every animation off.

## What's in it

- **Tools:** converters, generators, parsers and viewers that never send your
  data anywhere.
- **Gallery:** wallpapers, photos, GIFs, video and audio in albums.
- **Keys:** published SSH and GPG fingerprints, with verification planned.
- **Orthodox:** a slow, full-screen wall of icons for a spare screen.
