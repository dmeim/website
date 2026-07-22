import type { OGSchemaType } from "./types";

export const image: OGSchemaType = {
  name: "Image",
  elements: [
    {
      type: "input",
      label: "Image url",
      placeholder: "The url of your website social image...",
      key: "image",
    },
    {
      type: "input",
      label: "Image alt",
      placeholder: "The alternative text of your website social image...",
      key: "image:alt",
    },
    {
      type: "input",
      label: "Width",
      placeholder: "Width in px of your website social image...",
      key: "image:width",
    },
    {
      type: "input",
      label: "Height",
      placeholder: "Height in px of your website social image...",
      key: "image:height",
    },
  ],
};

export const twitter: OGSchemaType = {
  name: "Twitter",
  elements: [
    {
      type: "select",
      options: [
        { label: "Summary", value: "summary" },
        { label: "Summary with large image", value: "summary_large_image" },
        { label: "Application", value: "app" },
        { label: "Player", value: "player" },
      ],
      label: "Card type",
      placeholder: "The Twitter card type...",
      key: "twitter:card",
    },
    {
      type: "input",
      label: "Site account",
      placeholder:
        "The name of the Twitter account of the site (ex: @ittoolsdottech)...",
      key: "twitter:site",
    },
    {
      type: "input",
      label: "Creator acc.",
      placeholder:
        "The name of the Twitter account of the creator (ex: @cthmsst)...",
      key: "twitter:creator",
    },
  ],
};

const typeOptions = [
  { label: "Website", value: "website" },
  { label: "Article", value: "article" },
  { label: "Book", value: "book" },
  { label: "Profile", value: "profile" },
  {
    type: "group" as const,
    label: "Music",
    key: "Music",
    children: [
      { label: "Song", value: "music.song" },
      { label: "Music album", value: "music.album" },
      { label: "Playlist", value: "music.playlist" },
      { label: "Radio station", value: "music.radio_station" },
    ],
  },
  {
    type: "group" as const,
    label: "Video",
    key: "Video",
    children: [
      { label: "Movie", value: "video.movie" },
      { label: "Episode", value: "video.episode" },
      { label: "TV show", value: "video.tv_show" },
      { label: "Other video", value: "video.other" },
    ],
  },
];

export const website: OGSchemaType = {
  name: "General information",
  elements: [
    {
      type: "select",
      label: "Page type",
      placeholder: "Select the type of your website...",
      key: "type",
      options: typeOptions,
    },
    {
      type: "input",
      label: "Title",
      placeholder: "Enter the title of your website...",
      key: "title",
    },
    {
      type: "input",
      label: "Description",
      placeholder: "Enter the description of your website...",
      key: "description",
    },
    {
      type: "input",
      label: "Page URL",
      placeholder: "Enter the url of your website...",
      key: "url",
    },
  ],
};

export const article: OGSchemaType = {
  name: "Article",
  elements: [
    {
      type: "input",
      label: "Publishing date",
      key: "article:published_time",
      placeholder: "When the article was first published...",
    },
    {
      type: "input",
      label: "Modification date",
      key: "article:modified_time",
      placeholder: "When the article was last changed...",
    },
    {
      type: "input",
      label: "Expiration date",
      key: "article:expiration_time",
      placeholder: "When the article is out of date after...",
    },
    {
      type: "input",
      label: "Author",
      key: "article:author",
      placeholder: "Writers of the article...",
    },
    {
      type: "input",
      label: "Section",
      key: "article:section",
      placeholder: "A high-level section name. E.g. Technology..",
    },
    {
      type: "input",
      label: "Tag",
      key: "article:tag",
      placeholder: "Tag words associated with this article...",
    },
  ],
};

export const book: OGSchemaType = {
  name: "Book",
  elements: [
    {
      type: "input",
      label: "Author",
      key: "book:author",
      placeholder: "Who wrote this book...",
    },
    {
      type: "input",
      label: "ISBN",
      key: "book:isbn",
      placeholder: "The International Standard Book Number...",
    },
    {
      type: "input",
      label: "Release date",
      key: "book:release_date",
      placeholder: "The date the book was released...",
    },
    {
      type: "input",
      label: "Tag",
      key: "book:tag",
      placeholder: "Tag words associated with this book...",
    },
  ],
};

export const profile: OGSchemaType = {
  name: "Profile",
  elements: [
    {
      type: "input",
      label: "First name",
      placeholder: "Enter the first name of the person...",
      key: "profile:first_name",
    },
    {
      type: "input",
      label: "Last name",
      placeholder: "Enter the last name of the person...",
      key: "profile:last_name",
    },
    {
      type: "input",
      label: "Username",
      placeholder: "Enter the username of the person...",
      key: "profile:username",
    },
    {
      type: "input",
      label: "Gender",
      placeholder: "Enter the gender of the person...",
      key: "profile:gender",
    },
  ],
};

export const musicSong: OGSchemaType = {
  name: "Song details",
  elements: [
    {
      type: "input",
      label: "Duration",
      placeholder: "The duration of the song...",
      key: "music:duration",
    },
    {
      type: "input",
      label: "Album",
      placeholder: "The album this song is from...",
      key: "music:album",
    },
    {
      type: "input",
      label: "Disc",
      placeholder: "Which disc of the album this song is on...",
      key: "music:album:disk",
    },
    {
      type: "input",
      label: "Track",
      placeholder: " Which track this song is...",
      key: "music:album:track",
    },
    {
      type: "input-multiple",
      label: "Musician",
      placeholder: "The musician that made this song...",
      key: "music:musician",
    },
  ],
};

export const musicAlbum: OGSchemaType = {
  name: "Album details",
  elements: [
    {
      type: "input",
      label: "Song",
      key: "music:song",
      placeholder: "The song on this album...",
    },
    {
      type: "input",
      label: "Disc",
      key: "music:song:disc",
      placeholder: "The same as music:album:disc but in reverse...",
    },
    {
      type: "input",
      label: "Track",
      key: "music:song:track",
      placeholder: "The same as music:album:track but in reverse...",
    },
    {
      type: "input",
      label: "Musician",
      key: "music:musician",
      placeholder: "The musician that made this song...",
    },
    {
      type: "input",
      label: "Release date",
      key: "music:release_date",
      placeholder: "The date the album was released...",
    },
  ],
};

export const musicPlaylist: OGSchemaType = {
  name: "Playlist details",
  elements: [
    {
      type: "input",
      label: "Song",
      key: "music:song",
      placeholder: "The song on this album...",
    },
    {
      type: "input",
      label: "Disc",
      key: "music:song:disc",
      placeholder: "The same as music:album:disc but in reverse...",
    },
    {
      type: "input",
      label: "Track",
      key: "music:song:track",
      placeholder: "The same as music:album:track but in reverse...",
    },
    {
      type: "input",
      label: "Creator",
      key: "music:creator",
      placeholder: "The creator of this playlist...",
    },
  ],
};

export const musicRadioStation: OGSchemaType = {
  name: "Radio station details",
  elements: [
    {
      type: "input",
      label: "Creator",
      key: "music:creator",
      placeholder: "The creator of this radio station...",
    },
  ],
};

export const videoMovie: OGSchemaType = {
  name: "Movie details",
  elements: [
    {
      type: "input-multiple",
      label: "Actor",
      key: "video:actor",
      placeholder: "Name of the actress/actor...",
    },
    {
      type: "input-multiple",
      label: "Director",
      key: "video:director",
      placeholder: "Name of the director...",
    },
    {
      type: "input-multiple",
      label: "Writer",
      key: "video:writer",
      placeholder: "Writers of the movie...",
    },
    {
      type: "input",
      label: "Duration",
      key: "video:duration",
      placeholder: "The movie's length in seconds...",
    },
    {
      type: "input",
      label: "Release date",
      key: "video:release_date",
      placeholder: "The date the movie was released...",
    },
    {
      type: "input",
      label: "Tag",
      key: "video:tag",
      placeholder: "Tag words associated with this movie...",
    },
  ],
};

export const videoEpisode: OGSchemaType = {
  name: "Video episode details",
  elements: [
    ...videoMovie.elements,
    {
      type: "input",
      label: "Series",
      key: "video:series",
      placeholder: "Which series this episode belongs to...",
    },
  ],
};

export const videoTVShow: OGSchemaType = {
  name: "TV show details",
  elements: [...videoMovie.elements],
};

export const videoOther: OGSchemaType = {
  name: "Other video details",
  elements: [...videoMovie.elements],
};

/** Extra type-specific sections (not including website / image / twitter). */
export const ogSchemas: Record<string, OGSchemaType> = {
  "music.song": musicSong,
  "music.album": musicAlbum,
  "music.playlist": musicPlaylist,
  "music.radio_station": musicRadioStation,
  "video.movie": videoMovie,
  "video.episode": videoEpisode,
  "video.tv_show": videoTVShow,
  "video.other": videoOther,
  profile,
  article,
  book,
};
