import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { auth, db } from "../firebase";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "./Profile.css";

/* =========================================================
   GAME IMAGE LOOKUP
   Load all common image formats from the GamingVerse assets
   so every reviewed game can get its real artwork.
========================================================= */
const profileAllImages = import.meta.glob(
  "../assets/**/*.{jpg,jpeg,png,webp,avif}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

function normalizeGameKey(value = "") {
  return value
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|avif)$/i, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getImageKey(path = "") {
  const fileName = path.split("/").pop() || "";
  return normalizeGameKey(fileName);
}

const profileGameImages = Object.entries(profileAllImages).map(
  ([path, image]) => ({
    path,
    image,
    key: getImageKey(path),
  }),
);

function normalizeSocialList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => {
      if (item && typeof item === "object") {
        return { ...item, uid: item.uid || item.userId || item.id || key };
      }
      return { uid: key };
    });
  }

  return [];
}

const gameAliases = {
  blackmythwukong: ["blackmythwukong", "blackmyth", "wukong"],
  assassinscreedshadows: [
    "assassinscreedshadows",
    "assassinscreed",
    "acshadows",
    "acs",
  ],
  gtav: ["gtav", "grandtheftautov", "gta5"],
  gtavi: ["gtavi", "grandtheftautovi", "gta6"],
  cyberpunk2077: ["cyberpunk2077", "cyberpunk"],
  assassinscreedshadows: [
    "assassinscreedshadows",
    "assassinscreed",
    "acshadows",
  ],
  rdr2: ["rdr2", "reddeadredemption2"],
  reddeadredemption2: ["rdr2", "reddeadredemption2"],
  ghostoftsushima: ["ghostoftsushima", "ghost"],
  godofwar: ["godofwar", "gow"],
  counterstrike2: ["counterstrike2", "cs2"],
  lastofuspartii: ["lastofuspartii", "lastofus2", "tlou2"],
  godofwarragnarok: [
    "godofwarragnarok",
    "godofwar5",
    "gowragnarok",
    "ragnarok",
  ],
  marvelsspiderman2: ["marvelsspiderman2", "spiderman2", "spiderman"],
  hogwartslegacy: ["hogwartslegacy"],
  eldenring: ["eldenring"],
  residentevil4: ["residentevil4", "re4"],
  callofdutyblackops6: ["callofdutyblackops6", "blackops6", "bo6"],
  forzahorizon5: ["forzahorizon5", "fh5"],
  starwarsoutlaws: ["starwarsoutlaws"],
  helldivers2: ["helldivers2"],
  alanwake2: ["alanwake2"],
  dragonsdogma2: ["dragonsdogma2"],
  finalfantasyviirebirth: [
    "finalfantasyviirebirth",
    "ff7rebirth",
    "ffviirebirth",
  ],
};

/* Canonical names used by GamingVerse reviews. */
const canonicalGameAliases = {
  "black myth: wukong": ["blackmythwukong", "blackmyth", "wukong"],
  "black myth wukong": ["blackmythwukong", "blackmyth", "wukong"],
  "assassin's creed shadows": [
    "assassinscreedshadows",
    "assassinscreed",
    "acshadows",
    "acs",
  ],
  "grand theft auto v": ["gtav", "gta5", "grandtheftautov"],
  "gta v": ["gtav", "gta5", "grandtheftautov"],
  "grand theft auto vi": ["gtavi", "gta6", "grandtheftautovi"],
  "gta vi": ["gtavi", "gta6", "grandtheftautovi"],
  "cyberpunk 2077": ["cyberpunk2077", "cyberpunk"],
  "ghost of tsushima": ["ghostoftsushima", "ghost"],
  "red dead redemption 2": ["rdr2", "reddeadredemption2"],
  "the last of us part ii": ["lastofuspartii", "lastofus2", "tlou2"],
  "god of war ragnarok": [
    "godofwarragnarok",
    "godofwar5",
    "gowragnarok",
    "ragnarok",
  ],
  "marvel's spider-man 2": ["marvelsspiderman2", "spiderman2", "spiderman"],
  "hogwarts legacy": ["hogwartslegacy", "hogwarts"],
  "elden ring": ["eldenring", "elden"],
  "resident evil 4": ["residentevil4", "re4"],
  "call of duty: black ops 6": ["callofdutyblackops6", "blackops6", "bo6"],
  "forza horizon 5": ["forzahorizon5", "fh5"],
  "star wars outlaws": ["starwarsoutlaws", "outlaws"],
  "helldivers 2": ["helldivers2"],
  "alan wake 2": ["alanwake2"],
  "dragon's dogma 2": ["dragonsdogma2", "dd2"],
  "final fantasy vii rebirth": [
    "finalfantasyviirebirth",
    "ff7rebirth",
    "ffviirebirth",
  ],
};

function getGameImage(gameName = "") {
  const key = normalizeGameKey(gameName);
  if (!key) return "";

  // 1. Exact filename match.
  const exact = profileGameImages.find((item) => item.key === key);
  if (exact) return exact.image;

  // 2. Known aliases.
  const aliases = gameAliases[key] || [];
  if (aliases.length) {
    const aliasMatch = profileGameImages.find((item) =>
      aliases.some(
        (alias) =>
          item.key === alias ||
          item.key.includes(alias) ||
          alias.includes(item.key),
      ),
    );

    if (aliasMatch) return aliasMatch.image;
  }

  // 2b. Canonical aliases for the catalogue names.
  const canonicalAliases =
    canonicalGameAliases[gameName.trim().toLowerCase()] || [];
  if (canonicalAliases.length) {
    const canonicalMatch = profileGameImages.find((item) =>
      canonicalAliases.some(
        (alias) =>
          item.key === alias ||
          item.key.includes(alias) ||
          alias.includes(item.key),
      ),
    );
    if (canonicalMatch) return canonicalMatch.image;
  }

  // 3. Partial filename match.
  const partial = profileGameImages.find(
    (item) => item.key.includes(key) || key.includes(item.key),
  );

  if (partial) return partial.image;

  // 4. Token matching. This handles filenames with extra
  // words such as "cover", "poster", "horizontal", etc.
  const tokens = gameName
    .toLowerCase()
    .replace(/['’`]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

  if (tokens.length) {
    const scored = profileGameImages
      .map((item) => ({
        ...item,
        score: tokens.reduce(
          (total, token) => total + (item.key.includes(token) ? 1 : 0),
          0,
        ),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (
      scored.length &&
      scored[0].score >= Math.max(1, Math.ceil(tokens.length * 0.5))
    ) {
      return scored[0].image;
    }
  }

  return "";
}

function formatGameName(gameName = "") {
  const normalized = gameName.trim();

  const knownNames = {
    "cyberpunk-2077": "Cyberpunk 2077",
    cyberpunk2077: "Cyberpunk 2077",
    "assassin-s-creed-shadows": "Assassin's Creed Shadows",
    "assassin-s creed shadows": "Assassin's Creed Shadows",
    "assassins-creed-shadows": "Assassin's Creed Shadows",
    "assassins creed shadows": "Assassin's Creed Shadows",
    rdr2: "Red Dead Redemption 2",
    "red-dead-redemption-2": "Red Dead Redemption 2",
    "ghost-of-tsushima": "Ghost of Tsushima",
    "god-of-war": "God of War",
    "counter-strike-2": "Counter-Strike 2",
    "black-myth-wukong": "Black Myth: Wukong",
  };

  return (
    knownNames[normalized.toLowerCase()] ||
    normalized
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(
    () => new URLSearchParams(window.location.search).get("edit") === "true",
  );

  const [accountRole, setAccountRole] = useState("");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    username: "",
    dob: "",
    bio: "",
    instagram: "",
    twitter: "",
    youtube: "",
    photoURL: "",
    businessName: "",
    cafeName: "",
    businessPhone: "",
    businessAddress: "",
    businessHours: "",
    businessDescription: "",
    businessWebsite: "",
  });

  const [myReviews, setMyReviews] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab === "collections" ? "collections" : "reviews";
  });
  const [filter, setFilter] = useState("all");

  const [collectionGames, setCollectionGames] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_collections") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [playedGames, setPlayedGames] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_watched") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [playLaterGames, setPlayLaterGames] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_watch_later") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  // Social lists used by the Followers / Following pop-up.
  const [socialLists, setSocialLists] = useState({
    followers: [],
    following: [],
  });
  const [socialModal, setSocialModal] = useState(null);
  const [socialMembers, setSocialMembers] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    setActiveTab(tab === "collections" ? "collections" : "reviews");
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      const defaultName =
        currentUser.displayName || currentUser.email?.split("@")[0] || "Gamer";

      const nameParts = defaultName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      try {
        const snapshot = await get(ref(db, `users/${currentUser.uid}`));
        const data = snapshot.exists() ? snapshot.val() : {};

        const loadedRole = String(data.role || "").toLowerCase();
        setAccountRole(loadedRole);

        setProfile({
          firstName: data.firstName || firstName,
          lastName: data.lastName || lastName,
          username: data.username || currentUser.displayName || defaultName,
          dob: data.dob || "",
          bio: data.bio || "",
          instagram: data.instagram || "",
          twitter: data.twitter || "",
          youtube: data.youtube || "",
          photoURL: data.photoURL || currentUser.photoURL || "",
          businessName:
            data.businessName || data.shopName || data.cafeName || "",
          cafeName: data.cafeName || data.businessName || "",
          businessPhone: data.businessPhone || data.phone || "",
          businessAddress: data.businessAddress || data.address || "",
          businessHours: data.businessHours || data.openingHours || "",
          businessDescription:
            data.businessDescription || data.description || "",
          businessWebsite: data.businessWebsite || data.website || "",
        });

        // Keep the existing profile data untouched while also reading social lists.
        setSocialLists({
          followers: normalizeSocialList(
            data.followers || data.followedBy || [],
          ),
          following: normalizeSocialList(
            data.following || data.followingUsers || [],
          ),
        });
      } catch (error) {
        console.error("Error loading profile:", error);

        setAccountRole("");
        setProfile({
          firstName,
          lastName,
          username: defaultName,
          dob: "",
          bio: "",
          instagram: "",
          twitter: "",
          youtube: "",
          photoURL: currentUser.photoURL || "",
          businessName: "",
          cafeName: "",
          businessPhone: "",
          businessAddress: "",
          businessHours: "",
          businessDescription: "",
          businessWebsite: "",
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load reviews already posted from the existing GamingVerse review storage.
  useEffect(() => {
    const loadMyReviews = () => {
      const reviews = [];

      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);

        if (!key?.startsWith("gamingverse_community_reviews_")) {
          continue;
        }

        const gameId = key.replace("gamingverse_community_reviews_", "");

        try {
          const saved = JSON.parse(localStorage.getItem(key) || "[]");

          if (!Array.isArray(saved)) continue;

          saved.forEach((review) => {
            if (!review?.text) return;

            const storedGameName = review.gameName || gameId;
            reviews.push({
              ...review,
              gameId,
              gameName: formatGameName(storedGameName),
              gameImage: getGameImage(storedGameName) || review.gameImage || "",
            });
          });
        } catch (error) {
          console.error("Could not load review:", error);
        }
      }

      reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setMyReviews(reviews);
    };

    loadMyReviews();
    window.addEventListener("storage", loadMyReviews);

    return () => {
      window.removeEventListener("storage", loadMyReviews);
    };
  }, []);

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim() ||
    profile.username ||
    "GamingVerse User";

  const filteredReviews = useMemo(() => {
    if (filter === "all") return myReviews;

    if (filter === "recent") {
      return [...myReviews].sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      );
    }

    if (["skip", "timepass", "go-for-it", "perfection"].includes(filter)) {
      return myReviews.filter((review) => review.verdict === filter);
    }

    return myReviews;
  }, [myReviews, filter]);

  const openSocialModal = async (type) => {
    const entries = socialLists[type] || [];
    setSocialModal(type);
    setSocialMembers([]);
    setSocialLoading(true);

    try {
      const members = await Promise.all(
        entries.map(async (entry) => {
          const item =
            typeof entry === "object" && entry !== null
              ? entry
              : { uid: entry };
          const uid = item.uid || item.userId || item.id || "";
          let data = item;

          if (uid && !item.username && !item.displayName && !item.firstName) {
            try {
              const snapshot = await get(ref(db, `users/${uid}`));
              if (snapshot.exists()) data = { ...item, ...snapshot.val() };
            } catch (error) {
              console.error("Could not load social profile:", error);
            }
          }

          const displayName =
            data.displayName ||
            `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
            data.name ||
            data.username ||
            "GamingVerse User";
          const username = data.username || data.displayName || "gamer";

          return {
            uid,
            displayName,
            username: username.startsWith("@") ? username.slice(1) : username,
            photoURL: data.photoURL || "",
          };
        }),
      );

      setSocialMembers(members.filter(Boolean));
    } finally {
      setSocialLoading(false);
    }
  };

  const formatAge = (timestamp) => {
    if (!timestamp) return "";

    const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const verdictLabel = {
    perfection: "PERFECTION",
    "go-for-it": "GO FOR IT",
    timepass: "TIMEPASS",
    skip: "SKIP",
  };

  const calculateAge = (dob) => {
    if (!dob) return null;

    const birthDate = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const beforeBirthday =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate());

    if (beforeBirthday) {
      age -= 1;
    }

    return age;
  };

  const profileAge = calculateAge(profile.dob);

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Profile photo must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPhotoFile(file);
      setProfile((previous) => ({
        ...previous,
        photoURL: String(reader.result || ""),
      }));
      setMessage("");
    };

    reader.onerror = () => {
      setMessage("Could not preview the selected photo.");
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!user) return;

    const cleanUsername = profile.username.trim();

    // Café owners use a separate business profile. They do not need the
    // gamer DOB/age-access validation used by normal Gamer accounts.
    if (accountRole === "cafe_owner") {
      const cleanBusinessName =
        profile.businessName.trim() || profile.cafeName.trim();

      if (!cleanBusinessName) {
        setMessage("Please add your café/business name.");
        return;
      }

      setSaving(true);
      setMessage("");

      try {
        let savedPhotoURL = profile.photoURL.trim();

        if (photoFile) {
          const storage = getStorage();
          const safeFileName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const photoRef = storageRef(
            storage,
            `profilePhotos/${user.uid}/${Date.now()}_${safeFileName}`,
          );
          const uploadResult = await uploadBytes(photoRef, photoFile);
          savedPhotoURL = await getDownloadURL(uploadResult.ref);
        }

        const ownerData = {
          role: "cafe_owner",
          businessName: cleanBusinessName,
          cafeName: profile.cafeName.trim() || cleanBusinessName,
          businessPhone: profile.businessPhone.trim(),
          businessAddress: profile.businessAddress.trim(),
          businessHours: profile.businessHours.trim(),
          businessDescription: profile.businessDescription.trim(),
          businessWebsite: profile.businessWebsite.trim(),
          photoURL: savedPhotoURL,
        };

        await update(ref(db, `users/${user.uid}`), ownerData);
        await updateProfile(user, {
          displayName: cleanBusinessName,
          ...(savedPhotoURL ? { photoURL: savedPhotoURL } : {}),
        });

        setProfile((previous) => ({
          ...previous,
          ...ownerData,
        }));
        setPhotoFile(null);
        setMessage("Café business profile saved successfully.");

        setTimeout(() => {
          setIsEditing(false);
          setMessage("");
        }, 900);
      } catch (error) {
        console.error("Café owner profile save error:", error);
        setMessage(error.message || "Failed to save business profile.");
      } finally {
        setSaving(false);
      }

      return;
    }

    if (!cleanUsername) {
      setMessage("Username cannot be empty.");
      return;
    }

    if (!profile.dob) {
      setMessage(
        "Please add your date of birth for GamingVerse age restrictions.",
      );
      return;
    }

    const age = calculateAge(profile.dob);

    if (age === null || age < 0 || age > 120) {
      setMessage("Please enter a valid date of birth.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      let savedPhotoURL = profile.photoURL.trim();

      if (photoFile) {
        const storage = getStorage();
        const safeFileName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const photoRef = storageRef(
          storage,
          `profilePhotos/${user.uid}/${Date.now()}_${safeFileName}`,
        );

        const uploadResult = await uploadBytes(photoRef, photoFile);
        savedPhotoURL = await getDownloadURL(uploadResult.ref);
      }

      const updatedData = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        username: cleanUsername,
        dob: profile.dob,
        age,
        bio: profile.bio.trim(),
        instagram: profile.instagram.trim(),
        twitter: profile.twitter.trim(),
        youtube: profile.youtube.trim(),
        photoURL: savedPhotoURL,
      };

      await updateProfile(user, {
        displayName: cleanUsername,
        ...(savedPhotoURL ? { photoURL: savedPhotoURL } : {}),
      });

      await update(ref(db, `users/${user.uid}`), updatedData);

      setProfile(updatedData);
      setPhotoFile(null);
      setMessage("Profile saved successfully.");

      setTimeout(() => {
        setIsEditing(false);
        setMessage("");
      }, 900);
    } catch (error) {
      console.error("Profile save error:", error);
      setMessage(error.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading GamingVerse...</div>;
  }

  if (!user) return null;

  if (isEditing && accountRole === "cafe_owner") {
    const ownerName =
      profile.businessName.trim() ||
      profile.cafeName.trim() ||
      user.displayName ||
      "Café Owner";

    return (
      <div className="cafe-owner-profile-page">
        <header className="cafe-owner-profile-header">
          <button
            type="button"
            className="cafe-owner-profile-brand"
            onClick={() => navigate("/games")}
          >
            <span className="cafe-owner-profile-brand-icon">☕</span>
            <span>
              <strong>GamingVerse Business</strong>
              <small>Café Owner Profile</small>
            </span>
          </button>
          <button
            type="button"
            className="cafe-owner-profile-back"
            onClick={() => setIsEditing(false)}
          >
            ← Back to Business Profile
          </button>
        </header>

        <main className="cafe-owner-profile-main">
          <section className="cafe-owner-profile-edit-card">
            <div className="cafe-owner-profile-edit-hero">
              <div className="cafe-owner-profile-avatar large">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Café business" />
                ) : (
                  <span>☕</span>
                )}
              </div>
              <div>
                <span className="cafe-owner-profile-kicker">
                  BUSINESS ACCOUNT
                </span>
                <h1>Edit Café Profile</h1>
                <p>
                  Manage the information customers see about your café business.
                </p>
              </div>
              <label
                className="cafe-owner-photo-upload"
                htmlFor="profile-photo-upload"
              >
                Change Photo
              </label>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                className="profile-file-input"
                onChange={handlePhotoSelect}
              />
            </div>

            <form className="cafe-owner-profile-form" onSubmit={handleSave}>
              <div className="cafe-owner-field">
                <label htmlFor="businessName">Business Name</label>
                <input
                  id="businessName"
                  name="businessName"
                  value={profile.businessName}
                  onChange={handleEditChange}
                  placeholder="Your gaming café name"
                />
              </div>

              <div className="cafe-owner-field">
                <label htmlFor="cafeName">Café Name</label>
                <input
                  id="cafeName"
                  name="cafeName"
                  value={profile.cafeName}
                  onChange={handleEditChange}
                  placeholder="Café name shown to customers"
                />
              </div>

              <div className="cafe-owner-field">
                <label htmlFor="businessPhone">Contact Number</label>
                <input
                  id="businessPhone"
                  name="businessPhone"
                  value={profile.businessPhone}
                  onChange={handleEditChange}
                  placeholder="Business phone number"
                />
              </div>

              <div className="cafe-owner-field">
                <label htmlFor="businessHours">Opening Hours</label>
                <input
                  id="businessHours"
                  name="businessHours"
                  value={profile.businessHours}
                  onChange={handleEditChange}
                  placeholder="e.g. 10:00 AM – 11:00 PM"
                />
              </div>

              <div className="cafe-owner-field full">
                <label htmlFor="businessAddress">Café Address</label>
                <textarea
                  id="businessAddress"
                  name="businessAddress"
                  value={profile.businessAddress}
                  onChange={handleEditChange}
                  placeholder="Full café address"
                  rows="3"
                />
              </div>

              <div className="cafe-owner-field full">
                <label htmlFor="businessWebsite">Website</label>
                <input
                  id="businessWebsite"
                  name="businessWebsite"
                  value={profile.businessWebsite}
                  onChange={handleEditChange}
                  placeholder="https://yourcafe.example"
                />
              </div>

              <div className="cafe-owner-field full">
                <label htmlFor="businessDescription">About Your Café</label>
                <textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={profile.businessDescription}
                  onChange={handleEditChange}
                  placeholder="Tell customers about your gaming café, PCs, consoles and services..."
                  rows="5"
                  maxLength="500"
                />
                <small>{profile.businessDescription.length}/500</small>
              </div>

              {message && (
                <div
                  className={`cafe-owner-profile-message ${message.includes("successfully") ? "success" : "error"}`}
                >
                  {message}
                </div>
              )}

              <div className="cafe-owner-profile-actions">
                <button
                  type="button"
                  className="cafe-owner-secondary-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cafe-owner-primary-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Business Profile"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="edit-profile-page">
        <aside className="edit-sidebar">
          <button
            className="edit-sidebar-logo"
            type="button"
            onClick={() => setIsEditing(false)}
          >
            <span className="edit-sidebar-logo-icon">🎮</span>
            <span>
              <strong>GamingVerse</strong>
              <small>Level up your gaming experience</small>
            </span>
          </button>

          <button className="edit-side-item active" type="button">
            <span>👤</span>
            Profile
          </button>

          <button
            className="edit-side-item"
            type="button"
            onClick={() => navigate("/games?view=collections")}
          >
            <span>🎮</span>
            My Library
          </button>

          <button
            className="edit-side-item"
            type="button"
            onClick={() => navigate("/games")}
          >
            <span>⌂</span>
            Home
          </button>

          <div className="edit-sidebar-bottom">
            <button
              className="edit-side-item logout-side"
              type="button"
              onClick={handleLogout}
            >
              <span>↪</span>
              Log Out
            </button>
          </div>
        </aside>

        <main className="edit-profile-main">
          <div className="edit-profile-top">
            <button
              className="back-profile-button"
              type="button"
              onClick={() => setIsEditing(false)}
            >
              ← Back to Profile
            </button>

            <h1>Edit Profile</h1>
            <p>Update your GamingVerse profile information.</p>
          </div>

          <form className="edit-profile-card" onSubmit={handleSave}>
            <div className="edit-photo-section">
              <label
                className="upload-photo-button"
                htmlFor="profile-photo-upload"
              >
                <div className="large-profile-avatar">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" />
                  ) : (
                    <span aria-hidden="true">📷</span>
                  )}

                  <div className="upload-photo-overlay" aria-hidden="true">
                    📷
                  </div>
                </div>
              </label>

              <div className="edit-photo-copy">
                <h3>Profile photo</h3>
                <p>Upload a new profile photo</p>

                <input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  className="profile-file-input"
                  onChange={handlePhotoSelect}
                />

                {photoFile && (
                  <span className="selected-photo-name">{photoFile.name}</span>
                )}
              </div>
            </div>

            <div className="edit-divider" />

            <section className="edit-section">
              <h2>Personal Information</h2>

              <div className="edit-grid">
                <div className="edit-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleEditChange}
                    placeholder="First name"
                  />
                </div>

                <div className="edit-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleEditChange}
                    placeholder="Last name"
                  />
                </div>

                <div className="edit-field full-field">
                  <label htmlFor="username">Username</label>

                  <div className="username-input-wrap">
                    <span>@</span>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={profile.username}
                      onChange={handleEditChange}
                      placeholder="Username"
                    />
                  </div>
                </div>

                <div className="edit-field full-field">
                  <label htmlFor="dob">Date of Birth</label>
                  <input
                    id="dob"
                    type="date"
                    name="dob"
                    value={profile.dob}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="edit-field full-field age-status-field">
                  <label>GamingVerse Age Access</label>
                  <div className="age-status-card">
                    {profileAge === null ? (
                      <>
                        <strong>Age not set</strong>
                        <span>
                          Add your date of birth to enable game age
                          restrictions.
                        </span>
                      </>
                    ) : profileAge < 16 ? (
                      <>
                        <strong>Under 16 · Protected Access</strong>
                        <span>16+ and 18+ games will be restricted.</span>
                      </>
                    ) : profileAge < 18 ? (
                      <>
                        <strong>16–17 · 16+ Access</strong>
                        <span>
                          Games rated 16+ are available; 18+ games remain
                          restricted.
                        </span>
                      </>
                    ) : (
                      <>
                        <strong>18+ · Full Age Access</strong>
                        <span>
                          Access is based on each game's age rating and safety
                          status.
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="edit-field full-field">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleEditChange}
                    placeholder="Tell the GamingVerse community about yourself..."
                    rows="5"
                    maxLength="300"
                  />
                  <small>{profile.bio.length}/300</small>
                </div>
              </div>
            </section>

            <div className="edit-divider" />

            <section className="edit-section">
              <h2>Social Links</h2>

              <div className="edit-grid">
                <div className="edit-field">
                  <label htmlFor="instagram">Instagram</label>
                  <input
                    id="instagram"
                    type="text"
                    name="instagram"
                    value={profile.instagram}
                    onChange={handleEditChange}
                    placeholder="@username"
                  />
                </div>

                <div className="edit-field">
                  <label htmlFor="twitter">Twitter / X</label>
                  <input
                    id="twitter"
                    type="text"
                    name="twitter"
                    value={profile.twitter}
                    onChange={handleEditChange}
                    placeholder="@username"
                  />
                </div>

                <div className="edit-field full-field">
                  <label htmlFor="youtube">YouTube</label>
                  <input
                    id="youtube"
                    type="text"
                    name="youtube"
                    value={profile.youtube}
                    onChange={handleEditChange}
                    placeholder="YouTube channel URL"
                  />
                </div>
              </div>
            </section>

            {message && (
              <div
                className={
                  message.includes("success")
                    ? "profile-message success"
                    : "profile-message error"
                }
              >
                {message}
              </div>
            )}

            <div className="edit-actions">
              <button
                type="button"
                className="cancel-profile-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-profile-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  if (accountRole === "cafe_owner") {
    const ownerName =
      profile.businessName.trim() ||
      profile.cafeName.trim() ||
      user.displayName ||
      "Café Owner";

    return (
      <div className="cafe-owner-profile-page">
        <header className="cafe-owner-profile-header">
          <button
            type="button"
            className="cafe-owner-profile-brand"
            onClick={() => navigate("/games")}
          >
            <span className="cafe-owner-profile-brand-icon">☕</span>
            <span>
              <strong>GamingVerse Business</strong>
              <small>Café Owner Portal</small>
            </span>
          </button>

          <div className="cafe-owner-profile-header-actions">
            <span className="cafe-owner-role-pill">Café Owner</span>
            <button
              type="button"
              className="cafe-owner-dashboard-btn"
              onClick={() => navigate("/owner-dashboard")}
            >
              Owner Dashboard
            </button>
            <button
              type="button"
              className="cafe-owner-logout-btn"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </header>

        <main className="cafe-owner-profile-main">
          <section className="cafe-owner-profile-hero">
            <div className="cafe-owner-profile-identity">
              <div className="cafe-owner-profile-avatar">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={ownerName} />
                ) : (
                  <span>☕</span>
                )}
              </div>

              <div>
                <span className="cafe-owner-profile-kicker">
                  GAMINGVERSE BUSINESS
                </span>
                <h1>{ownerName}</h1>
                <p>{profile.cafeName || "Gaming Café"}</p>
                <span className="cafe-owner-verified-pill">
                  ✓ Verified Café Owner
                </span>
              </div>
            </div>

            <button
              type="button"
              className="cafe-owner-edit-btn"
              onClick={() => setIsEditing(true)}
            >
              ✎ Edit Business Profile
            </button>
          </section>

          <section className="cafe-owner-profile-grid">
            <article className="cafe-owner-profile-card cafe-owner-about-card">
              <span className="cafe-owner-profile-kicker">
                ABOUT THE BUSINESS
              </span>
              <h2>{profile.cafeName || ownerName}</h2>
              <p>
                {profile.businessDescription ||
                  "Gaming café profile. Add your café description from Edit Business Profile so customers can learn about your setup and services."}
              </p>
            </article>

            <article className="cafe-owner-profile-card">
              <span className="cafe-owner-profile-kicker">CAFÉ DETAILS</span>
              <div className="cafe-owner-detail-list">
                <div>
                  <span>📍 Address</span>
                  <strong>
                    {profile.businessAddress || "Add café address"}
                  </strong>
                </div>
                <div>
                  <span>📞 Contact</span>
                  <strong>
                    {profile.businessPhone || "Add business contact"}
                  </strong>
                </div>
                <div>
                  <span>🕒 Opening Hours</span>
                  <strong>
                    {profile.businessHours || "Add opening hours"}
                  </strong>
                </div>
                <div>
                  <span>🌐 Website</span>
                  <strong>
                    {profile.businessWebsite || "No website added"}
                  </strong>
                </div>
              </div>
            </article>

            <article className="cafe-owner-profile-card">
              <span className="cafe-owner-profile-kicker">
                BUSINESS ACTIONS
              </span>
              <div className="cafe-owner-action-grid">
                <button
                  type="button"
                  onClick={() => navigate("/owner-dashboard")}
                >
                  <span>📅</span>
                  <div>
                    <strong>Manage Bookings</strong>
                    <small>Confirm or cancel customer café bookings.</small>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/owner-dashboard")}
                >
                  <span>🖱️</span>
                  <div>
                    <strong>Sell Accessories</strong>
                    <small>
                      Add computer and gaming accessories to Marketplace.
                    </small>
                  </div>
                </button>
              </div>
            </article>

            <article className="cafe-owner-profile-card">
              <span className="cafe-owner-profile-kicker">ACCOUNT</span>
              <div className="cafe-owner-account-row">
                <span>Owner Email</span>
                <strong>{user.email || "—"}</strong>
              </div>
              <div className="cafe-owner-account-row">
                <span>Account Type</span>
                <strong>Café Owner</strong>
              </div>
              <div className="cafe-owner-account-row">
                <span>Joined</span>
                <strong>
                  {user.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString(
                        "en-US",
                        { month: "short", year: "numeric" },
                      )
                    : "GamingVerse"}
                </strong>
              </div>
            </article>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button
          className="profile-logo"
          type="button"
          onClick={() => navigate("/games")}
          aria-label="Go to GamingVerse home"
        >
          <span className="profile-logo-icon">🎮</span>

          <span className="profile-logo-text">
            <strong>GamingVerse</strong>
            <small>Level up your gaming experience</small>
          </span>
        </button>
      </header>

      <main className="profile-content">
        <section className="profile-left-card">
          <div className="profile-avatar">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" />
            ) : (
              <span>
                {(profile.firstName || profile.username || "G")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <h1>{fullName}</h1>
          <p className="profile-username">@{profile.username}</p>

          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <div>
              <strong>{myReviews.length}</strong>
              <span>
                Reviews
                <br />
                Posted
              </span>
            </div>

            <div>
              <strong>0</strong>
              <span>
                Public
                <br />
                Collections
              </span>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail-line">
              <span>♟</span>
              <strong>0 Followers</strong>
              <b>•</b>
              <strong>0 Following</strong>

              <button
                type="button"
                className="social-count-button social-followers-button"
                onClick={() => openSocialModal("followers")}
              >
                {socialLists.followers.length} Followers
              </button>
              <button
                type="button"
                className="social-count-button social-following-button"
                onClick={() => openSocialModal("following")}
              >
                {socialLists.following.length} Following
              </button>
            </div>

            <div className="profile-detail-line">
              <span>▣</span>
              <strong>
                Joined{" "}
                {user.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" },
                    )
                  : "GamingVerse"}
              </strong>
            </div>
          </div>

          <button
            className="edit-profile-button"
            type="button"
            onClick={() => setIsEditing(true)}
          >
            ✎ Edit Profile
          </button>

          <button
            className="logout-profile-button"
            type="button"
            onClick={handleLogout}
          >
            ↪ Log Out
          </button>
        </section>

        <section className="profile-middle">
          <div className="profile-tabs">
            <button
              className={
                activeTab === "reviews" ? "profile-tab active" : "profile-tab"
              }
              type="button"
              onClick={() => setActiveTab("reviews")}
            >
              ✎ <span>Reviews</span>
            </button>

            <button
              className={
                activeTab === "collections"
                  ? "profile-tab active"
                  : "profile-tab"
              }
              type="button"
              onClick={() => setActiveTab("collections")}
            >
              ▱ <span>Collections</span>
            </button>
          </div>

          {activeTab === "reviews" ? (
            <>
              <div className="profile-filter-row">
                {[
                  ["all", "All"],
                  ["skip", "Skip"],
                  ["timepass", "Timepass"],
                  ["go-for-it", "Go For It"],
                  ["perfection", "Perfection"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={
                      filter === value ? "filter-btn active" : "filter-btn"
                    }
                    type="button"
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}

                <div className="review-view-tools">
                  <button type="button" className="view-tool active">
                    ☷
                  </button>
                  <button type="button" className="view-tool">
                    ▦
                  </button>
                  <button type="button" className="view-tool">
                    ⌕
                  </button>
                </div>
              </div>

              {filteredReviews.length === 0 ? (
                <div className="profile-empty-state">
                  <div className="empty-icon">✎</div>

                  <h2>
                    {myReviews.length === 0
                      ? "You haven't posted any reviews yet"
                      : "No reviews match this filter"}
                  </h2>

                  <p>
                    {myReviews.length === 0
                      ? "Start sharing your opinions on games with the GamingVerse community."
                      : "Try another review category to see your posts."}
                  </p>

                  {myReviews.length === 0 && (
                    <button type="button" onClick={() => navigate("/games")}>
                      Explore Games
                    </button>
                  )}
                </div>
              ) : (
                <div className="my-reviews-list">
                  {filteredReviews.map((review) => (
                    <article
                      className="my-review-card my-review-card-clickable"
                      key={review.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/games?openGame=${encodeURIComponent(
                            review.gameName,
                          )}&return=profile&tab=reviews`,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(
                            `/games?openGame=${encodeURIComponent(
                              review.gameName,
                            )}&return=profile&tab=reviews`,
                          );
                        }
                      }}
                    >
                      <div className="my-review-head">
                        <div className="my-review-game">
                          <div className="my-review-game-icon">
                            {getGameImage(review.gameName) ||
                            review.gameImage ? (
                              <img
                                src={
                                  getGameImage(review.gameName) ||
                                  review.gameImage
                                }
                                alt={review.gameName}
                                loading="lazy"
                              />
                            ) : (
                              <span aria-hidden="true">🎮</span>
                            )}
                          </div>

                          <div>
                            <h3>{review.gameName}</h3>
                            <span>{formatAge(review.createdAt)}</span>
                          </div>
                        </div>

                        <span
                          className={`my-review-verdict ${
                            review.verdict || "timepass"
                          }`}
                        >
                          {verdictLabel[review.verdict] || "REVIEW"}
                        </span>
                      </div>

                      <p className="my-review-text">{review.text}</p>

                      <div className="my-review-footer">
                        <span>♡ {review.likes || 0}</span>
                        <span>◯ {review.comments || 0}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="profile-collections-view">
              <div className="profile-collections-header">
                <div>
                  <span className="profile-collections-kicker">
                    YOUR LIBRARY
                  </span>
                  <h2>Collections</h2>
                  <p>
                    Everything you save is organized here so you can find it
                    quickly.
                  </p>
                </div>
              </div>

              <div className="profile-collections-three-column">
                {/* COLLECTIONS */}
                <section className="profile-library-panel">
                  <div className="profile-library-heading">
                    <div>
                      <span>SAVED</span>
                      <h3>Collections</h3>
                    </div>
                    <b>{collectionGames.length}</b>
                  </div>

                  {collectionGames.length > 0 ? (
                    <div className="profile-library-list">
                      {collectionGames.map((gameName) => {
                        const image = getGameImage(gameName);
                        return (
                          <button
                            className="profile-library-item profile-library-item-button"
                            type="button"
                            title={`Open ${formatGameName(gameName)}`}
                            onClick={() => {
                              sessionStorage.setItem(
                                "gamingverse_open_game",
                                gameName,
                              );
                              navigate(
                                `/games?openGame=${encodeURIComponent(gameName)}&return=profile`,
                              );
                            }}
                          >
                            <div className="profile-library-image">
                              {image ? (
                                <img
                                  src={image}
                                  alt={gameName}
                                  loading="lazy"
                                />
                              ) : (
                                <span aria-hidden="true">🎮</span>
                              )}
                            </div>
                            <div className="profile-library-copy">
                              <strong>{formatGameName(gameName)}</strong>
                              <small>Saved to collection</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="profile-library-empty">
                      <span>♧</span>
                      <strong>No saved games</strong>
                      <small>Use Collections on a game to add it here.</small>
                    </div>
                  )}
                </section>

                {/* PLAYED */}
                <section className="profile-library-panel profile-played-panel">
                  <div className="profile-library-heading">
                    <div>
                      <span>HISTORY</span>
                      <h3>Marked as Played</h3>
                    </div>
                    <b>{playedGames.length}</b>
                  </div>

                  {playedGames.length > 0 ? (
                    <div className="profile-library-list">
                      {playedGames.map((gameName) => {
                        const image = getGameImage(gameName);
                        return (
                          <button
                            className="profile-library-item profile-library-item-button"
                            type="button"
                            title={`Open ${formatGameName(gameName)}`}
                            onClick={() => {
                              sessionStorage.setItem(
                                "gamingverse_open_game",
                                gameName,
                              );
                              navigate(
                                `/games?openGame=${encodeURIComponent(gameName)}&return=profile`,
                              );
                            }}
                          >
                            <div className="profile-library-image">
                              {image ? (
                                <img
                                  src={image}
                                  alt={gameName}
                                  loading="lazy"
                                />
                              ) : (
                                <span aria-hidden="true">🎮</span>
                              )}
                            </div>
                            <div className="profile-library-copy">
                              <strong>{formatGameName(gameName)}</strong>
                              <small>Marked as played</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="profile-library-empty">
                      <span>✓</span>
                      <strong>No played games</strong>
                      <small>Use Mark as played from a game's details.</small>
                    </div>
                  )}
                </section>

                {/* PLAY LATER */}
                <section className="profile-library-panel profile-later-panel">
                  <div className="profile-library-heading">
                    <div>
                      <span>UP NEXT</span>
                      <h3>Play Later</h3>
                    </div>
                    <b>{playLaterGames.length}</b>
                  </div>

                  {playLaterGames.length > 0 ? (
                    <div className="profile-library-list">
                      {playLaterGames.map((gameName) => {
                        const image = getGameImage(gameName);
                        return (
                          <button
                            className="profile-library-item profile-library-item-button"
                            type="button"
                            title={`Open ${formatGameName(gameName)}`}
                            onClick={() => {
                              sessionStorage.setItem(
                                "gamingverse_open_game",
                                gameName,
                              );
                              navigate(
                                `/games?openGame=${encodeURIComponent(gameName)}&return=profile`,
                              );
                            }}
                          >
                            <div className="profile-library-image">
                              {image ? (
                                <img
                                  src={image}
                                  alt={gameName}
                                  loading="lazy"
                                />
                              ) : (
                                <span aria-hidden="true">🎮</span>
                              )}
                            </div>
                            <div className="profile-library-copy">
                              <strong>{formatGameName(gameName)}</strong>
                              <small>Saved for later</small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="profile-library-empty">
                      <span>◷</span>
                      <strong>No games for later</strong>
                      <small>
                        Use Play Later on a game you want to return to.
                      </small>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </section>
      </main>

      {socialModal && (
        <div
          className="social-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSocialModal(null);
          }}
        >
          <section
            className="social-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-modal-title"
          >
            <div className="social-modal-header">
              <h2 id="social-modal-title">
                {socialModal === "followers" ? "Followers" : "Following"}
              </h2>
              <button
                type="button"
                className="social-modal-close"
                aria-label="Close"
                onClick={() => setSocialModal(null)}
              >
                ×
              </button>
            </div>

            <div className="social-modal-list">
              {socialLoading ? (
                <div className="social-modal-empty">Loading...</div>
              ) : socialMembers.length === 0 ? (
                <div className="social-modal-empty">
                  {socialModal === "followers"
                    ? "No followers yet."
                    : "Not following anyone yet."}
                </div>
              ) : (
                socialMembers.map((member, index) => (
                  <div
                    className="social-user-row"
                    key={member.uid || `${member.username}-${index}`}
                  >
                    <div className="social-user-avatar">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt="" />
                      ) : (
                        <span>
                          {member.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="social-user-copy">
                      <strong>{member.displayName}</strong>
                      <span>@{member.username}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Profile;
