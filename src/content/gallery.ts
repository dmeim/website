import type { GalleryAlbumMeta } from "../lib/gallery/types";
import { collectionOrder } from "./orthodox";

/**
 * Words for /gallery. Every image the site uses lives under
 * `src/assets/gallery/`. An album is any folder there, and a sub-folder is a
 * section of its album (Icons has one per month); an item is any image, GIF,
 * video or audio file inside it. An image with the
 * same name as a video or audio file (`clip.mp4` + `clip.jpg`) becomes its
 * poster or cover art instead of a separate item. Everything here is
 * optional: albums and items without an entry get a title from their file
 * name and no description. Item keys are file names without the extension,
 * (prefixed with `<section>/` inside a sub-folder), and the order they are
 * listed in is the order they appear. Every album offers downloads of the
 * original files unless it sets `download: false`.
 *
 * `projects/<slug>/` holds each project's screenshots; their words live in
 * `src/content/projects/<slug>.md`, not here.
 *
 * Cloudflare serves files up to 25 MiB; the build fails on anything larger.
 */

/** Album order on /gallery; folders not listed follow alphabetically. */
export const albumOrder: readonly string[] = ["studio", "cutouts", "icons"];

export const albumMeta: Record<string, GalleryAlbumMeta> = {
  studio: {
    title: "Studio",
    description:
      "A portrait session against a slate backdrop: black suit, soft key light, a handful of poses.",
    cover: "headshot",
    items: {
      headshot: {
        title: "Headshot",
        description:
          "The one that became the site portrait. Black on black, slate behind, the light falling from the left.",
        alt: "Head-and-shoulders portrait in a black suit, shirt and tie against a slate grey backdrop",
      },
      "headshot-navy": {
        title: "Headshot, navy",
        description:
          "An early test with a navy jacket and an open white collar. Warmer and less formal than the final pick.",
        alt: "Close portrait in a navy jacket and open white shirt against a light grey backdrop",
      },
      framed: {
        title: "Framed",
        description:
          "Pulled back to the chest so the jacket lapels frame the face. A slight tilt and an easy smile.",
        alt: "Chest-up portrait in a black suit and tie, head tilted slightly, slate backdrop",
      },
      crossarmed: {
        title: "Arms crossed",
        description: "The classic stance. Three-quarter length, arms folded, square to the camera.",
        alt: "Three-quarter portrait standing with arms crossed in a black suit against a slate backdrop",
      },
      jackethold: {
        title: "Jacket hold",
        description: "One hand on the lapel, the other in a pocket. A little more movement in the frame.",
        alt: "Standing portrait holding the jacket lapel with one hand, black suit, slate backdrop",
      },
      pockets: {
        title: "Pockets",
        description: "Both hands in pockets, weight even, looking straight down the lens.",
        alt: "Standing portrait with both hands in trouser pockets, black suit, slate backdrop",
      },
      broad: {
        title: "Square on",
        description: "Shoulders squared, hands tucked away. The most formal frame of the set.",
        alt: "Standing portrait facing the camera directly with hands in pockets, black suit, slate backdrop",
      },
      lean: {
        title: "Lean",
        description: "A slight lean onto one leg, which loosens the whole pose.",
        alt: "Standing portrait leaning slightly to one side, hands in pockets, black suit, slate backdrop",
      },
      sidelook: {
        title: "Side look",
        description: "Eyes off camera to the right, as if someone just called a name.",
        alt: "Standing portrait glancing off to the side, one hand in a pocket, black suit, slate backdrop",
      },
      sidepocket: {
        title: "Side pocket",
        description: "Turned a quarter away with one hand in a pocket and the other loose.",
        alt: "Standing portrait turned slightly, one hand in a pocket, black suit, slate backdrop",
      },
      sitting: {
        title: "Sitting",
        description: "On a low stool, elbows on knees. The calmest frame in the session.",
        alt: "Seated portrait on a stool, forearms resting on knees, black suit, slate backdrop",
      },
      unbuttoned: {
        title: "Unbuttoned",
        description: "Tie off, collar open, jacket loose. The end-of-the-day version.",
        alt: "Standing portrait with an open-collared black shirt and no tie, black suit, slate backdrop",
      },
    },
  },
  cutouts: {
    title: "Cutouts",
    description:
      "The same session with the backdrop removed, for laying over anything. Transparent PNGs; download the original to keep the alpha.",
    cover: "framed",
    items: {
      framed: {
        title: "Framed",
        description: "The chest-up frame on its own. Works at any size on any colour.",
        alt: "Chest-up cutout portrait in a black suit and tie on a transparent background",
      },
      crossarmed: {
        title: "Arms crossed",
        description: "Three-quarter length with arms folded, cut clean at the hem of the frame.",
        alt: "Cutout portrait standing with arms crossed in a black suit on a transparent background",
      },
      jackethold: {
        title: "Jacket hold",
        description: "Hand on the lapel. The cutout used in the UI library showcase.",
        alt: "Cutout portrait holding the jacket lapel in a black suit on a transparent background",
      },
      pockets: {
        title: "Pockets",
        description: "Hands in pockets, square to camera.",
        alt: "Cutout portrait with both hands in pockets in a black suit on a transparent background",
      },
      sidelook: {
        title: "Side look",
        description: "Glancing off to the right; good for placing beside text that reads toward it.",
        alt: "Cutout portrait glancing to the side in a black suit on a transparent background",
      },
      sidepocket: {
        title: "Side pocket",
        description: "A quarter turn with one hand in a pocket.",
        alt: "Cutout portrait turned slightly with one hand in a pocket on a transparent background",
      },
      sitting: {
        title: "Sitting",
        description: "Seated on the stool. The stool comes along, so it needs a floor to sit on.",
        alt: "Cutout portrait seated on a stool in a black suit on a transparent background",
      },
      unbuttoned: {
        title: "Unbuttoned",
        description: "Collar open, no tie.",
        alt: "Cutout portrait with an open collar and no tie in a black suit on a transparent background",
      },
    },
  },
  icons: {
    title: "Icons",
    description: "Orthodox icons, grouped by month. The Orthodox icon wall hangs these.",
    sections: collectionOrder,
  },
};
