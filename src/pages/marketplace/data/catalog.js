/* =========================================================
   MARKETPLACE OPTIONS
   Tabs, categories, order steps and the empty seller form.
========================================================= */

export const MARKET_TABS = [
  {
    id: "games",
    icon: "🎮",
    label: "Games / CDs",
    subtitle: "PS5 • PS4 • Xbox • PC",
  },
  {
    id: "accessories",
    icon: "🖱️",
    label: "Computer & Gaming Accessories",
    subtitle: "Mouse • Keyboard • Headset • Monitor & more",
  },
];

export const ACCESSORY_CATEGORIES = [
  "All",
  "Mouse",
  "Keyboard",
  "Headset",
  "Controller",
  "Mouse Pad",
  "Webcam",
  "Microphone",
  "Monitor",
];

export const ORDER_STEPS = ["Placed", "Confirmed", "Packed", "Shipped", "Delivered"];

export const EMPTY_PRODUCT = {
  name: "",
  platform: "PS5",
  category: "Action",
  condition: "New",
  price: "",
  stock: "",
  image: "",
  description: "",
};
