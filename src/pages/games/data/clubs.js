/* =========================================================
   GAMING CLUBS
   Client-side prototype data. Club membership, new clubs and
   discussions are saved in localStorage for this build.
========================================================= */

export const DEFAULT_GAMING_CLUBS = [
  {
    id: "action-adventure",
    name: "Action & Adventure",
    interest: "Action",
    description:
      "Talk about open-world adventures, story campaigns and action games.",
    members: 128,
    accent: "#a832ff",
  },
  {
    id: "fps-arena",
    name: "FPS Arena",
    interest: "FPS",
    description:
      "Competitive FPS players, strategies, loadouts and match discussions.",
    members: 96,
    accent: "#b04cff",
  },
  {
    id: "rpg-world",
    name: "RPG World",
    interest: "RPG",
    description: "Builds, quests, characters, lore and everything RPG.",
    members: 84,
    accent: "#c15cff",
  },
  {
    id: "playstation-hub",
    name: "PlayStation Hub",
    interest: "PlayStation",
    description:
      "PS4 and PS5 gamers sharing releases, tips and co-op sessions.",
    members: 112,
    accent: "#8f2df0",
  },
  {
    id: "xbox-zone",
    name: "Xbox Zone",
    interest: "Xbox",
    description:
      "Xbox One and Xbox Series X|S gamers connecting and playing together.",
    members: 77,
    accent: "#9f3cff",
  },
  {
    id: "pc-gamers",
    name: "PC Gamers",
    interest: "PC",
    description:
      "PC gaming hardware, performance, builds and multiplayer sessions.",
    members: 143,
    accent: "#b43dff",
  },
];

export const DEFAULT_CLUB_DISCUSSIONS = [
  {
    id: "club-discussion-1",
    clubId: "action-adventure",
    title: "What should I play after finishing Ghost of Tsushima?",
    author: "Gamer",
    meta: "2h ago • 12 replies",
  },
  {
    id: "club-discussion-2",
    clubId: "fps-arena",
    title: "Best competitive FPS settings for a smoother aim?",
    author: "ShadowX",
    meta: "5h ago • 8 replies",
  },
  {
    id: "club-discussion-3",
    clubId: "rpg-world",
    title: "Which RPG has the best world design?",
    author: "Arjun",
    meta: "Yesterday • 19 replies",
  },
];
