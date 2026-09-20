import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { get, onValue, ref, update } from "firebase/database";
import { auth, db } from "../firebase";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import PageSkeleton from "../components/PageSkeleton.jsx";
import "./Profile.css";

import {
  formatGameName,
  getGameImage,
} from "./profile/utils/gameImages.js";
import { normalizeSocialList } from "./profile/utils/social.js";

import EditProfileView from "./profile/views/EditProfileView.jsx";
import OwnerEditView from "./profile/views/OwnerEditView.jsx";
import OwnerProfileView from "./profile/views/OwnerProfileView.jsx";
import ProfileView from "./profile/views/ProfileView.jsx";

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
  const [reviewViewMode, setReviewViewMode] = useState("list");
  const [showReviewSearch, setShowReviewSearch] = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");

  const [collectionGames] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_collections") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [playedGames] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("gamingverse_watched") || "[]",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [playLaterGames] = useState(() => {
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

  // This account's written reviews, read from the same gameReviews node the
  // GamingVerse Meter counts. They used to come from localStorage, which
  // meant a review only existed in the browser that wrote it.
  useEffect(() => {
    // Nothing to subscribe to until auth resolves; the list already starts
    // empty, and signing out navigates away from this page.
    const uid = user?.uid;
    if (!uid) return undefined;

    return onValue(
      ref(db, "gameReviews"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const reviews = [];

        Object.entries(data).forEach(([gameId, gameEntries]) => {
          const mine = gameEntries?.[uid];
          const text = String(mine?.text || "").trim();
          // A verdict alone (no written text) is still a review — it was
          // being silently dropped here, so voting Skip/Timepass/Go For
          // It/Perfection without typing anything never showed up on the
          // profile at all.
          if (!mine?.review) return;

          const storedGameName = mine.gameName || gameId;
          reviews.push({
            id: gameId,
            gameId,
            gameName: formatGameName(storedGameName),
            gameImage: getGameImage(storedGameName) || "",
            userName: mine.userName || "Gamer",
            initials: mine.initials || "G",
            verdict: mine.review,
            text,
            createdAt: Number(mine.updatedAt || mine.createdAt) || 0,
            likes: Object.keys(mine.likes || {}).length,
          });
        });

        reviews.sort((a, b) => b.createdAt - a.createdAt);
        setMyReviews(reviews);
      },
      (error) => {
        console.error("Could not load your reviews:", error);
        setMyReviews([]);
      },
    );
  }, [user?.uid]);

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim() ||
    profile.username ||
    "GamingVerse User";

  const filteredReviews = useMemo(() => {
    let list = myReviews;

    if (filter === "recent") {
      list = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (["skip", "timepass", "go-for-it", "perfection"].includes(filter)) {
      list = list.filter((review) => review.verdict === filter);
    }

    const query = reviewSearch.trim().toLowerCase();
    if (query) {
      list = list.filter((review) =>
        review.gameName.toLowerCase().includes(query),
      );
    }

    return list;
  }, [myReviews, filter, reviewSearch]);

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
    return <PageSkeleton variant="list" />;
  }

  if (!user) return null;

  if (isEditing && accountRole === "cafe_owner") {
    return (
      <OwnerEditView
        handleEditChange={handleEditChange}
        handlePhotoSelect={handlePhotoSelect}
        handleSave={handleSave}
        message={message}
        navigate={navigate}
        profile={profile}
        saving={saving}
        setIsEditing={setIsEditing}
      />
    );
  }

  if (isEditing) {
    return (
      <EditProfileView
        handleEditChange={handleEditChange}
        handleLogout={handleLogout}
        handlePhotoSelect={handlePhotoSelect}
        handleSave={handleSave}
        message={message}
        navigate={navigate}
        photoFile={photoFile}
        profile={profile}
        profileAge={profileAge}
        saving={saving}
        setIsEditing={setIsEditing}
      />
    );
  }

  if (accountRole === "cafe_owner") {
    return (
      <OwnerProfileView
        handleLogout={handleLogout}
        navigate={navigate}
        profile={profile}
        setIsEditing={setIsEditing}
        user={user}
      />
    );
  }

  return (
    <ProfileView
      activeTab={activeTab}
      collectionGames={collectionGames}
      filter={filter}
      filteredReviews={filteredReviews}
      formatAge={formatAge}
      fullName={fullName}
      handleLogout={handleLogout}
      myReviews={myReviews}
      navigate={navigate}
      openSocialModal={openSocialModal}
      playedGames={playedGames}
      playLaterGames={playLaterGames}
      profile={profile}
      reviewSearch={reviewSearch}
      reviewViewMode={reviewViewMode}
      setActiveTab={setActiveTab}
      setFilter={setFilter}
      setIsEditing={setIsEditing}
      setReviewSearch={setReviewSearch}
      setReviewViewMode={setReviewViewMode}
      setShowReviewSearch={setShowReviewSearch}
      setSocialModal={setSocialModal}
      showReviewSearch={showReviewSearch}
      socialLists={socialLists}
      socialLoading={socialLoading}
      socialMembers={socialMembers}
      socialModal={socialModal}
      user={user}
      verdictLabel={verdictLabel}
    />
  );
}

export default Profile;
