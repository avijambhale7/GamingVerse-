/* =========================================================
   REVIEW OPTIONS
   The four GamingVerse verdicts and their empty vote tally.

   `title` is the loud form used for headings, `label` the
   sentence-case form used on chips and badges. Both live here
   so no caller has to reformat the other one by hand.

   Listed worst to best; the meter arc and legend read in this
   order, so keep it.
========================================================= */

export const reviewOptions = [
  {
    id: "skip",
    icon: "🔴",
    title: "SKIP",
    label: "Skip",
    description: "Not recommended",
  },
  {
    id: "timepass",
    icon: "🟡",
    title: "TIMEPASS",
    label: "Timepass",
    description: "Fun for casual gaming",
  },
  {
    id: "go-for-it",
    icon: "🟢",
    title: "GO FOR IT",
    label: "Go for it",
    description: "Definitely worth playing",
  },
  {
    id: "perfection",
    icon: "💜",
    title: "PERFECTION",
    label: "Perfection",
    description: "Must-play game",
  },
];

export const emptyCounts = {
  perfection: 0,
  "go-for-it": 0,
  timepass: 0,
  skip: 0,
};
