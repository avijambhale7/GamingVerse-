import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { get, push, ref, remove, runTransaction, set } from "firebase/database";
import { auth, db } from "../firebase";
import "./Cafe.css";

const TOTAL_STATIONS = 6; // Default demo capacity; change later per café if needed.
const CAFES = [
  {
    id: "cafe1",
    name: "Rapid Round Cafe",
    address:
      "1st floor, Deccan Heights, bus stop, opposite Deccan, above Ramesh Dyeing, Pulachi Wadi, Deccan Gymkhana, Pune, Maharashtra 411004",
    phone: "09561812121",
    email: "rapidrounds@gmail.com",
    opening: "9:00 AM",
    closing: "9:00 PM",
    rating: 4.8,
    website: "http://www.rapidrounds.in/",
    mapUrl: "https://maps.app.goo.gl/3YFi3E1dpcSwCmsJ6",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe2",
    name: "Dragon Lord Esports | Gaming Cafe",
    address:
      "Flat no. B-3, Second Floor, Apte Rd, above IDBI Bank Sai Chaya Apartment, Deccan Gymkhana, Pune, Maharashtra 411004",
    phone: "07719886629",
    email: "Not available",
    opening: "9:00 AM",
    closing: "10:00 PM",
    rating: 4.7,
    website: "https://www.justdial.com/Pune/Dragon-Lord-Esports",
    mapUrl: "https://maps.app.goo.gl/5epx4R4gXxHenzhV9",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe3",
    name: "TGT Esports Studio | Gaming Cafe",
    address:
      "Shop no 101, 1st Floor, WBIZ, Bhumkar Chowk Rd, near Ginger Hotel, Wakad, Pimpri-Chinchwad, Maharashtra 411033",
    phone: "08149715775",
    email: "info@tgtgaming.com",
    opening: "8:30 AM",
    closing: "11:30 PM",
    rating: 4.8,
    website: "https://tgtgaming.com/",
    mapUrl: "https://maps.app.goo.gl/jSmB3CcSY56kq5mN7",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe4",
    name: "Ministry of Esports (Esports Gaming Cafe)",
    address:
      "6th floor, Water's Square, R-01, New DP Rd, Brahmavrind Housing Society, Vishal Nagar, Pimple Nilakh, Pune, Maharashtra 411027",
    phone: "09067199655",
    email: "management@eikasia.gg",
    opening: "Online appointment",
    closing: "Online appointment",
    rating: 4.8,
    website: "https://www.instagram.com/moes.gg/?hl=en",
    mapUrl: "https://maps.app.goo.gl/d66XfEyr3gyEQ2hXA",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe5",
    name: "Vibezone Esports Lounge | Gaming Cafe",
    address:
      "Shop No 10, Unity Splendour, 69/1B/1, Salunke Vihar Rd, Phase 1, Borade Nagar, Wanowrie, Pune, Maharashtra 411040",
    phone: "08484861934",
    email: "contact@vibezoneesports.in",
    opening: "24 hours",
    closing: "24 hours",
    rating: 4.4,
    website: "http://vibezoneesports.in/",
    mapUrl: "https://maps.app.goo.gl/12takvstZspfHH5g6",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe6",
    name: "Boomer's Gaming Café",
    address:
      "Second floor, Datta Mandir Chowk 204, Viman Nagar, Pune, Maharashtra 411014",
    phone: "08122210532",
    email: "Not available",
    opening: "10:00 AM",
    closing: "5:00 AM",
    rating: 4.9,
    website: "https://boomersgaming.com/",
    mapUrl: "https://maps.app.goo.gl/1CRnHTvz4f5Mj3N38",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe7",
    name: "Nostalgic Gaming (Gaming Cafe)",
    address:
      "1st Floor, Vision 9 Mall, shop no. 130, above Star Bazar, Pimple Saudagar, Pune, Maharashtra 411027",
    phone: "08482905800",
    email: "Not available",
    opening: "24 hours",
    closing: "24 hours",
    rating: 4.9,
    website: "https://nostalgicgaming.in",
    mapUrl: "https://maps.app.goo.gl/4M95VSscFzttyp588",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe8",
    name: "GGwellplayed Gaming Cafe",
    address:
      "1st Floor, Ganga Sankalp, opposite to TVS Shelar, Taware Colony, Parvati Paytha, Pune, Maharashtra 411009",
    phone: "08087793773",
    email: "goodgamingwellplayed@gmail.com",
    opening: "10:30 AM",
    closing: "10:30 PM",
    rating: 5.0,
    website: "",
    mapUrl: "https://maps.app.goo.gl/baeVERhPisrbtbNS7",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe9",
    name: "KRION Gaming Cafe",
    address: "Sus Pashan Brg, Baner Annex, Pashan, Pune, Maharashtra 411045",
    phone: "Not available",
    email: "Not available",
    opening: "9:00 AM",
    closing: "10:00 PM",
    rating: 5.0,
    website: "",
    mapUrl: "https://maps.app.goo.gl/pbX19pyv4yXHvtw7A",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe10",
    name: "KGF GAMING CAFE",
    address: "5/36, Parsanees Colony, Maharshi Nagar, Pune, Maharashtra 411037",
    phone: "07276957778",
    email: "Not available",
    opening: "24 hours",
    closing: "24 hours",
    rating: 5.0,
    website: "",
    mapUrl: "https://maps.app.goo.gl/Q41Gr3sw5C8rE7tR8",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe11",
    name: "Infinity Gaming Cafe",
    address: "Vedant Complex, 1/2, Vadgaon Budruk, Pune, Maharashtra 411041",
    phone: "09511753959",
    email: "Not available",
    opening: "10:00 AM",
    closing: "4:00 AM",
    rating: 4.6,
    website: "",
    mapUrl: "https://maps.app.goo.gl/TfChCLCB7gBC4iUr7",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe12",
    name: "Neon Gaming Studio | Gaming Cafe",
    address:
      "Shop No 120, 1st Floor, WBIZ, Bhumkar Chowk Rd, near Vision One Mall, Wakad, Pimpri-Chinchwad, Pune, Maharashtra 411033",
    phone: "09307645762",
    email: "Not available",
    opening: "24 hours",
    closing: "24 hours",
    rating: 4.9,
    website: "https://www.instagram.com/neongamingstudio2025/",
    mapUrl: "https://maps.app.goo.gl/BqMrCFosDB44qMNKA",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe13",
    name: "Headshot Hub - Gaming Cafe, Kharadi Pune",
    address:
      "Gate 2, Fortune Plaza, opposite Forest County, EON Free Zone, Kharadi, Pune, Maharashtra 411014",
    phone: "09607465207",
    email: "headshothub07@gmail.com",
    opening: "8:00 AM",
    closing: "12:00 AM",
    rating: 4.9,
    website: "https://www.headshothub.in/",
    mapUrl: "https://maps.app.goo.gl/oFY32Vi2DQNHgVHs9",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe14",
    name: "Rapid Rounds Gaming Cafe Undri",
    address:
      "first floor shop no 112, VTP tradepark, near KFC, Shree Siddhivinayak Meera, Undri, Pune, Maharashtra 411060",
    phone: "09892092121",
    email: "rapidrounds@gmail.com",
    opening: "9:00 AM",
    closing: "12:00 AM",
    rating: 5.0,
    website: "http://www.rapidrounds.in/",
    mapUrl: "https://maps.app.goo.gl/jhZN2cAA6eEejvoU9",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe15",
    name: "Shorex Esports - The Gaming Arena",
    address:
      "Shop no.102, The Centrum, Bhumkar Chowk Rd, Ashok Nagar, Tathawade, Pimpri-Chinchwad, Maharashtra 411033",
    phone: "07558757877",
    email: "shorex.esports@gmail.com",
    opening: "9:00 AM",
    closing: "11:00 PM",
    rating: 4.9,
    website: "https://shorex-esports.vercel.app/",
    mapUrl: "https://maps.app.goo.gl/i9MjzuYqiNTTCMjr8",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe16",
    name: "Velocity Gaming Café",
    address:
      "Office no. 302, Velocity Gaming Cafè, Mandot Tower, Gangadham-Shatrunjay Rd, opposite Shree Shantinagar Society Internal Road, Kasat Nagar, Kondhwa Budruk, Pune, Maharashtra 411048",
    phone: "09579940989",
    email: "Not available",
    opening: "10:00 AM",
    closing: "10:00 PM",
    rating: 4.9,
    website: "",
    mapUrl: "https://maps.app.goo.gl/hgmTWhj9aZ6BHY7K7",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe17",
    name: "MOGAMBO Gaming Cafe PS5",
    address: "First floor, More Corner, Pune, Maharashtra 412207",
    phone: "Not available",
    email: "Not available",
    opening: "24 hours",
    closing: "24 hours",
    rating: 5.0,
    website: "",
    mapUrl: "https://maps.app.goo.gl/eQRoBA4d8Fpc3Xfz7",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe18",
    name: "Gamerz Hideout Gaming Cafe",
    address:
      "Sanjeevani Hospital Lane, Sarathi House, Plot no. 172, Chikhali Akurdi Rd, Koyana Nagar, Pimpri-Chinchwad, Maharashtra 411019",
    phone: "07841930418",
    email: "Not available",
    opening: "24 hours",
    closing: "24 hours",
    rating: 4.4,
    website: "https://linktr.ee/gamerzhideout",
    mapUrl: "https://maps.app.goo.gl/LNh3eh9ApNVBe76J7",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe19",
    name: "KRION Gaming Cafe (Pashan)",
    address: "Sus Pashan Brg, Baner Annex, Pashan, Pune, Maharashtra 411045",
    phone: "Not available",
    email: "Not available",
    opening: "9:00 AM",
    closing: "10:00 PM",
    rating: 5.0,
    website: "",
    mapUrl: "https://maps.app.goo.gl/eQRoBA4d8Fpc3Xfz7",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe20",
    name: "YNOTGAME - Premium Gaming Café & Store",
    address:
      "3rd Floor, Sonigara Landmark, 314, near Chatrapati Chowk Road, Dynasty Society, Kaspate Wasti, Wakad, Pimpri-Chinchwad, Maharashtra 411057",
    phone: "08623906149",
    email: "Not available",
    opening: "10:30 AM",
    closing: "10:00 PM",
    rating: 4.7,
    website: "https://www.instagram.com/ynotgame",
    mapUrl: "https://maps.app.goo.gl/4N7LnVGj9d85xCmV8",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe21",
    name: "Gamer's Town - Gamezone / Gaming Cafe",
    address:
      "Shop no, La Regalia, 14 & 15, Akurdi Railway Station Rd, Sector No. 26, Pradhikaran, Nigdi, Pimpri-Chinchwad, Maharashtra 411044",
    phone: "07387784106",
    email: "Not available",
    opening: "9:00 AM",
    closing: "10:00 PM",
    rating: 4.0,
    website: "",
    mapUrl: "https://maps.app.goo.gl/BAr2W7mDYvwTS5AG6",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
  {
    id: "cafe22",
    name: "Rockstar Gaming Cafe",
    address:
      "First Floor, Aryan Food Chopati, Shree Ram Complex, Shriram Chowk, near Laxmi Chowk Road, Phase 1, Rajiv Gandhi Infotech Park, Hinjawadi, Maharashtra 411057",
    phone: "09371925757",
    email: "krishu.business7@gmail.com",
    opening: "24 hours",
    closing: "24 hours",
    rating: 5.0,
    website: "https://64bitgaming.club/",
    mapUrl: "https://maps.app.goo.gl/6GDnswyKvQNoRgDK6",
    description: "Gaming café listed in the GamingVerse café directory.",
  },
];

const pad = (n) => String(n).padStart(2, "0");
function parseTime(value) {
  const m = String(value || "").match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] || 0);
  const ampm = m[3]?.toUpperCase();
  if (ampm === "AM" && hour === 12) hour = 0;
  if (ampm === "PM" && hour !== 12) hour += 12;
  return hour * 60 + minute;
}
function formatTime(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${pad(minute)} ${suffix}`;
}
function getTimeSlots(opening, closing) {
  if (/online appointment/i.test(opening)) return [];
  if (/24\s*hours/i.test(opening))
    return Array.from({ length: 24 }, (_, i) => formatTime(i * 60));
  const start = parseTime(opening);
  const endRaw = parseTime(closing);
  if (start == null || endRaw == null) return [];
  let end = endRaw;
  if (end <= start) end += 24 * 60;
  const slots = [];
  for (let t = start; t < end; t += 60) slots.push(formatTime(t % (24 * 60)));
  return slots;
}
function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function localBookingKey(uid) {
  return `gamingverse_cafe_bookings_${uid}`;
}

function loadLocalBookings(uid) {
  try {
    const data = JSON.parse(localStorage.getItem(localBookingKey(uid)) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveLocalBookings(uid, bookings) {
  localStorage.setItem(localBookingKey(uid), JSON.stringify(bookings));
}

function localSlotCount(cafeId, date, time, uid) {
  const bookings = loadLocalBookings(uid);
  return bookings.filter(
    (b) => b.cafeId === cafeId && b.date === date && b.time === time,
  ).length;
}

export default function Cafe() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All");
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedTime, setSelectedTime] = useState("");
  const [bookings, setBookings] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showBookings, setShowBookings] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) await loadBookings(currentUser.uid);
    });
    return () => unsub();
  }, []);

  const notify = (text) => {
    setMessage(text);
    window.clearTimeout(window.gvCafeMessageTimer);
    window.gvCafeMessageTimer = window.setTimeout(() => setMessage(""), 3500);
  };

  const loadBookings = async (uid) => {
    const localBookings = loadLocalBookings(uid);

    try {
      const snap = await get(ref(db, `cafeBookings/${uid}`));
      const firebaseBookings = snap.exists()
        ? Object.entries(snap.val()).map(([id, value]) => ({
            id,
            ...value,
          }))
        : [];

      const merged = [
        ...firebaseBookings,
        ...localBookings.filter(
          (localBooking) =>
            !firebaseBookings.some(
              (firebaseBooking) =>
                firebaseBooking.localId === localBooking.localId,
            ),
        ),
      ].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

      setBookings(merged);
    } catch (error) {
      console.error("Cafe bookings Firebase load error:", error);
      setBookings(
        [...localBookings].sort(
          (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0),
        ),
      );
    }
  };

  const areas = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          CAFES.map((c) => {
            const match = c.address.match(
              /,\s*([^,]+),\s*(Pune|Pimpri-Chinchwad)/i,
            );
            return match ? match[1].trim() : "Pune";
          }),
        ),
      ),
    ],
    [],
  );

  const filteredCafes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CAFES.filter((c) => {
      const areaMatch =
        area === "All" || c.address.toLowerCase().includes(area.toLowerCase());
      const textMatch =
        !q || `${c.name} ${c.address}`.toLowerCase().includes(q);
      return areaMatch && textMatch;
    });
  }, [search, area]);

  const selectCafe = (cafe) => {
    setSelectedCafe(cafe);
    setSelectedTime("");
    setShowBookings(false);
  };

  const timeSlots = selectedCafe
    ? getTimeSlots(selectedCafe.opening, selectedCafe.closing)
    : [];

  useEffect(() => {
    let cancelled = false;
    const loadSlots = async () => {
      if (!selectedCafe || !selectedDate || !user || timeSlots.length === 0) {
        setSlotAvailability({});
        return;
      }
      setLoadingSlots(true);
      try {
        const next = {};

        await Promise.all(
          timeSlots.map(async (slot) => {
            const key = slot.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            const localCount = localSlotCount(
              selectedCafe.id,
              selectedDate,
              slot,
              user.uid,
            );

            try {
              const snap = await get(
                ref(
                  db,
                  `cafeSlots/${selectedCafe.id}/${selectedDate}/${key}/booked`,
                ),
              );
              next[slot] = Math.min(
                Math.max(Number(snap.val() || 0), localCount),
                TOTAL_STATIONS,
              );
            } catch {
              next[slot] = Math.min(localCount, TOTAL_STATIONS);
            }
          }),
        );

        if (!cancelled) setSlotAvailability(next);
      } catch (error) {
        console.error("Cafe slots load error:", error);
        if (!cancelled) {
          const fallback = {};
          timeSlots.forEach((slot) => {
            fallback[slot] = Math.min(
              localSlotCount(selectedCafe.id, selectedDate, slot, user.uid),
              TOTAL_STATIONS,
            );
          });
          setSlotAvailability(fallback);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [selectedCafe, selectedDate, user]);

  const bookCafe = async () => {
    if (!user) {
      notify("Please login first.");
      return;
    }

    if (!selectedCafe || !selectedDate || !selectedTime) {
      notify("Select a café, date and time slot.");
      return;
    }

    if (selectedDate < todayISO()) {
      notify("Please choose today or a future date.");
      return;
    }

    if (/online appointment/i.test(selectedCafe.opening)) {
      notify(
        "This café uses online appointment booking. Use its website/contact details.",
      );
      return;
    }

    const locallyBooked = localSlotCount(
      selectedCafe.id,
      selectedDate,
      selectedTime,
      user.uid,
    );

    const currentlyBooked = Math.max(
      Number(slotAvailability[selectedTime] || 0),
      locallyBooked,
    );

    if (currentlyBooked >= TOTAL_STATIONS) {
      notify("That slot is full. Please choose another time.");
      setSlotAvailability((prev) => ({
        ...prev,
        [selectedTime]: TOTAL_STATIONS,
      }));
      return;
    }

    setSaving(true);

    const localId = `local-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const bookingBase = {
      localId,
      cafeId: selectedCafe.id,
      cafeName: selectedCafe.name,
      address: selectedCafe.address,
      date: selectedDate,
      time: selectedTime,
      station: `Station ${(locallyBooked % TOTAL_STATIONS) + 1}`,
      status: "Confirmed",
      createdAt: Date.now(),
    };

    try {
      let savedToFirebase = false;

      try {
        const slotRef = ref(
          db,
          `cafeSlots/${selectedCafe.id}/${selectedDate}/${selectedTime
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}`,
        );

        const tx = await runTransaction(slotRef, (current) => {
          const booked = Number(current?.booked || 0);

          if (booked >= TOTAL_STATIONS) return;

          return {
            booked: booked + 1,
            updatedAt: Date.now(),
          };
        });

        if (!tx.committed) {
          notify("That slot is full. Please choose another time.");
          setSlotAvailability((prev) => ({
            ...prev,
            [selectedTime]: TOTAL_STATIONS,
          }));
          return;
        }

        const bookingRef = push(ref(db, `cafeBookings/${user.uid}`));

        await set(bookingRef, {
          ...bookingBase,
          localId,
        });

        const firebaseBooking = {
          id: bookingRef.key,
          ...bookingBase,
        };

        setBookings((prev) => [firebaseBooking, ...prev]);
        savedToFirebase = true;
      } catch (firebaseError) {
        console.warn(
          "Firebase booking write failed; using local booking fallback.",
          firebaseError,
        );
      }

      if (!savedToFirebase) {
        const localBookings = loadLocalBookings(user.uid);
        saveLocalBookings(user.uid, [bookingBase, ...localBookings]);

        setBookings((prev) => [bookingBase, ...prev]);

        notify(
          "✓ Booking confirmed on this device. Connect Firebase Database write access to sync across devices.",
        );
      } else {
        notify("✓ Café slot booked successfully.");
      }

      setSlotAvailability((prev) => ({
        ...prev,
        [selectedTime]: Math.min(
          Number(prev[selectedTime] || 0) + 1,
          TOTAL_STATIONS,
        ),
      }));
    } catch (error) {
      console.error("Cafe booking error:", error);
      notify("Booking failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (booking) => {
    if (!user) return;

    if (
      !window.confirm(
        `Cancel booking at ${booking.cafeName} on ${booking.date} at ${booking.time}?`,
      )
    ) {
      return;
    }

    try {
      if (String(booking.id || "").startsWith("local-")) {
        const nextLocal = loadLocalBookings(user.uid).filter(
          (item) => item.localId !== booking.localId,
        );
        saveLocalBookings(user.uid, nextLocal);
        setBookings((prev) =>
          prev.filter((x) => x.localId !== booking.localId),
        );
        setSlotAvailability((prev) => ({
          ...prev,
          [booking.time]: Math.max(0, Number(prev[booking.time] || 0) - 1),
        }));
        notify("Booking cancelled.");
        return;
      }

      const slotKey = booking.time.replace(/[^a-z0-9]/gi, "_").toLowerCase();

      try {
        await runTransaction(
          ref(db, `cafeSlots/${booking.cafeId}/${booking.date}/${slotKey}`),
          (current) => {
            if (!current) return current;
            const nextBooked = Math.max(0, Number(current.booked || 0) - 1);
            return nextBooked === 0
              ? null
              : {
                  ...current,
                  booked: nextBooked,
                  updatedAt: Date.now(),
                };
          },
        );

        await remove(ref(db, `cafeBookings/${user.uid}/${booking.id}`));
      } catch (firebaseError) {
        console.warn("Firebase cancellation write failed:", firebaseError);
      }

      const nextLocal = loadLocalBookings(user.uid).filter(
        (item) => item.localId !== booking.localId,
      );
      saveLocalBookings(user.uid, nextLocal);

      setBookings((prev) =>
        prev.filter(
          (x) => x.id !== booking.id && x.localId !== booking.localId,
        ),
      );

      setSlotAvailability((prev) => ({
        ...prev,
        [booking.time]: Math.max(0, Number(prev[booking.time] || 0) - 1),
      }));

      notify("Booking cancelled.");
    } catch (error) {
      console.error("Cancel booking error:", error);
      notify("Could not cancel booking.");
    }
  };

  if (loading)
    return <div className="cafe-loading">Loading GamingVerse Cafés...</div>;

  return (
    <div className="cafe-page">
      <header className="cafe-header">
        <button
          className="cafe-brand"
          type="button"
          onClick={() => navigate("/games")}
        >
          <span className="cafe-brand-icon">🎮</span>
          <span>
            <strong>GamingVerse</strong>
            <small>Level up your gaming experience</small>
          </span>
        </button>
        <div className="cafe-header-actions">
          <button type="button" onClick={() => navigate("/games")}>
            ← Games
          </button>
          <button
            type="button"
            className="cafe-bookings-btn"
            onClick={() => setShowBookings((v) => !v)}
          >
            📅 My Bookings{bookings.length ? ` (${bookings.length})` : ""}
          </button>
        </div>
      </header>

      <main className="cafe-main">
        <section className="cafe-hero">
          <div>
            <span>GAMINGVERSE CAFÉ BOOKING</span>
            <h1>
              Book your <b>gaming session.</b>
            </h1>
            <p>
              Discover gaming cafés in Pune, choose your date and an available
              time slot, then reserve your session.
            </p>
          </div>
          <div className="cafe-hero-stat">
            <strong>{CAFES.length}</strong>
            <small>cafés listed</small>
          </div>
        </section>

        <section className="cafe-search-bar">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search café name or area..."
          />
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="All">All Areas</option>
            {areas.slice(1).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </section>

        {message && <div className="cafe-message">{message}</div>}

        {showBookings ? (
          <section className="cafe-section-page">
            <div className="cafe-section-title">
              <div>
                <span>YOUR RESERVATIONS</span>
                <h2>My Café Bookings</h2>
              </div>
              <button type="button" onClick={() => setShowBookings(false)}>
                Browse Cafés
              </button>
            </div>
            {bookings.length ? (
              <div className="cafe-bookings-list">
                {bookings.map((b) => (
                  <article className="cafe-booking-card" key={b.id}>
                    <div>
                      <span className="booking-status">{b.status}</span>
                      <h3>{b.cafeName}</h3>
                      <p>
                        📅 {b.date} &nbsp; • &nbsp; 🕐 {b.time} &nbsp; • &nbsp;
                        🎮 {b.station}
                      </p>
                      <small>{b.address}</small>
                    </div>
                    <div>
                      <a
                        href={
                          CAFES.find((c) => c.id === b.cafeId)?.mapUrl || "#"
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Map ↗
                      </a>
                      <button
                        type="button"
                        className="cancel-booking"
                        onClick={() => cancelBooking(b)}
                      >
                        Cancel
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="cafe-empty">
                <div>📅</div>
                <h3>No bookings yet</h3>
                <p>Pick a café and reserve your first gaming session.</p>
              </div>
            )}
          </section>
        ) : selectedCafe ? (
          <section className="cafe-booking-view">
            <button
              className="cafe-back"
              type="button"
              onClick={() => setSelectedCafe(null)}
            >
              ← Back to cafés
            </button>
            <div className="cafe-detail-grid">
              <div className="cafe-detail-card">
                <div className="cafe-cover-icon">🎮</div>
                <div className="cafe-rating">★ {selectedCafe.rating}</div>
                <h2>{selectedCafe.name}</h2>
                <p>📍 {selectedCafe.address}</p>
                <div className="cafe-info-pills">
                  <span>
                    🕘 {selectedCafe.opening} – {selectedCafe.closing}
                  </span>
                  <span>🎮 {TOTAL_STATIONS} demo stations</span>
                </div>
                <div className="cafe-links">
                  {selectedCafe.website && (
                    <a
                      href={selectedCafe.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Official / Info ↗
                    </a>
                  )}
                  <a
                    href={selectedCafe.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Maps ↗
                  </a>
                  {selectedCafe.phone !== "Not available" && (
                    <a href={`tel:${selectedCafe.phone}`}>Call</a>
                  )}
                </div>
              </div>
              <div className="cafe-slot-card">
                <span className="cafe-step">STEP 1</span>
                <h2>Choose date & time</h2>
                <label>
                  Date
                  <input
                    type="date"
                    min={todayISO()}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                  />
                </label>
                {/online appointment/i.test(selectedCafe.opening) ? null : (
                  <>
                    <div className="slot-header">
                      <span>Available time slots</span>
                      <small>
                        {loadingSlots
                          ? "Checking availability..."
                          : `${TOTAL_STATIONS} stations per slot`}
                      </small>
                    </div>
                    <div className="slots-grid">
                      {timeSlots.map((slot) => {
                        const booked = Number(slotAvailability[slot] || 0);
                        const full = booked >= TOTAL_STATIONS;
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`time-slot ${selectedTime === slot ? "selected" : ""} ${full ? "full" : ""}`}
                            disabled={full || loadingSlots}
                            onClick={() => setSelectedTime(slot)}
                          >
                            <strong>{slot}</strong>
                            <small>
                              {full
                                ? "Full"
                                : `${TOTAL_STATIONS - booked} available`}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="confirm-booking"
                      type="button"
                      disabled={!selectedTime || saving || loadingSlots}
                      onClick={bookCafe}
                    >
                      {saving
                        ? "Booking..."
                        : selectedTime
                          ? `Confirm ${selectedTime} Booking`
                          : "Select a Time Slot"}
                    </button>
                  </>
                )}
                {/online appointment/i.test(selectedCafe.opening) && (
                  <div className="online-appointment">
                    <strong>Online appointment</strong>
                    <p>
                      This café does not publish normal opening/closing hours in
                      the supplied directory.
                    </p>
                    {selectedCafe.website && (
                      <a
                        href={selectedCafe.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open appointment/info page ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="cafe-section-page">
            <div className="cafe-section-title">
              <div>
                <span>DISCOVER</span>
                <h2>Gaming Cafés</h2>
                <p>{filteredCafes.length} café(s) found</p>
              </div>
            </div>
            <div className="cafe-grid">
              {filteredCafes.map((cafe) => (
                <article className="cafe-card" key={cafe.id}>
                  <div className="cafe-card-image">
                    <div>🎮</div>
                    <span>★ {cafe.rating}</span>
                  </div>
                  <div className="cafe-card-content">
                    <small>GAMING CAFÉ</small>
                    <h3>{cafe.name}</h3>
                    <p>📍 {cafe.address}</p>
                    <div className="cafe-card-meta">
                      <span>
                        🕘 {cafe.opening} – {cafe.closing}
                      </span>
                      <span>🎮 Gaming stations</span>
                    </div>
                    <div className="cafe-card-actions">
                      <button type="button" onClick={() => selectCafe(cafe)}>
                        Book Slot
                      </button>
                      <a href={cafe.mapUrl} target="_blank" rel="noreferrer">
                        Map ↗
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!filteredCafes.length && (
              <div className="cafe-empty">
                <div>🔎</div>
                <h3>No cafés found</h3>
                <p>Try another café name or area.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
