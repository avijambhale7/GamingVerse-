/* =========================================================
   useGamingClubs
   Gaming Clubs and Community Talks: the live club list, which
   clubs this user joined, the open club's chat, the community
   chat, and the join / leave / create / post actions.
   Membership counts are saved together with the user's own
   membership record (see saveClubMembership). Used by
   ../../Games.jsx.
========================================================= */
import { useEffect, useMemo, useState } from "react";
import {
  get,
  limitToLast,
  onValue,
  push,
  query,
  ref,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { auth, db } from "../../../firebase";
import { getClubInterestMeta } from "../data/clubs.js";

export default function useGamingClubs() {
  // Gaming Clubs, their membership and chat all live in Firebase now, so
  // two users actually see the same clubs instead of each browser holding
  // its own private copy in localStorage.
  const [gamingClubs, setGamingClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [joinedClubIds, setJoinedClubIds] = useState([]);
  const [clubInterest, setClubInterest] = useState("All");
  const [clubSearch, setClubSearch] = useState("");
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubInterest, setNewClubInterest] = useState("Action");
  const [newClubDescription, setNewClubDescription] = useState("");
  const [clubPost, setClubPost] = useState("");
  const [communityTalkPost, setCommunityTalkPost] = useState("");
  const [communityTalks, setCommunityTalks] = useState([]);
  const [clubDiscussions, setClubDiscussions] = useState([]);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, "clubs"),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data).map(([id, club]) => ({
          id,
          ...club,
        }));
        next.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        setGamingClubs(next);
      },
      (error) => console.error("Gaming clubs listener error:", error),
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Games.jsx only ever mounts while ProtectedRoute has an authenticated
    // user; logging out unmounts it, so there's no user-less case to
    // reset for here — joinedClubIds already starts at [].
    if (!auth.currentUser) return undefined;
    const unsubscribe = onValue(
      ref(db, `userClubs/${auth.currentUser.uid}`),
      (snapshot) => {
        const data = snapshot.val() || {};
        setJoinedClubIds(Object.keys(data));
      },
      (error) => console.error("Joined clubs listener error:", error),
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const talksQuery = query(ref(db, "communityTalks"), limitToLast(50));
    const unsubscribe = onValue(
      talksQuery,
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data).map(([id, talk]) => ({
          id,
          ...talk,
        }));
        // Chat order: oldest first, newest at the bottom.
        next.sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
        setCommunityTalks(next);
      },
      (error) => console.error("Community talks listener error:", error),
    );
    return () => unsubscribe();
  }, []);

  // Only the open club's discussion thread is fetched — with real clubs
  // there's no reason to pull every club's chat history up front.
  useEffect(() => {
    if (!selectedClubId) return undefined;
    const unsubscribe = onValue(
      ref(db, `clubDiscussions/${selectedClubId}`),
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data).map(([id, discussion]) => ({
          id,
          ...discussion,
        }));
        // Chat order: oldest first, newest at the bottom.
        next.sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
        setClubDiscussions(next);
      },
      (error) => console.error("Club discussion listener error:", error),
    );
    return () => unsubscribe();
  }, [selectedClubId]);

  const openClub = (clubId) => {
    setSelectedClubId(clubId);
    setShowCreateClub(false);
    setClubPost("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Joining/leaving saves the member count and your own membership in
  // one write — the database rules only accept the count change that way.
  // A clash with someone else's join just retries with the fresh count.
  const saveClubMembership = async (clubId, uid, join) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const snap = await get(ref(db, `clubs/${clubId}/memberCount`));
      const count = Math.max(0, Number(snap.val()) || 0);
      try {
        await update(ref(db), {
          [`clubs/${clubId}/memberCount`]: join ? count + 1 : Math.max(0, count - 1),
          [`userClubs/${uid}/${clubId}`]: join ? true : null,
        });
        return;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
  };

  const toggleClubMembership = async (clubId) => {
    // The card's Joined button is an OPEN action. Leaving a club is only
    // possible from inside the opened club, so it can never close by accident.
    if (joinedClubIds.includes(clubId)) {
      openClub(clubId);
      return;
    }
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      await saveClubMembership(clubId, uid, true);
    } catch (error) {
      console.error("Join club error:", error);
    }
    openClub(clubId);
  };

  const leaveClub = async (clubId) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      await saveClubMembership(clubId, uid, false);
    } catch (error) {
      console.error("Leave club error:", error);
    }
    closeClub();
  };

  const closeClub = () => {
    setSelectedClubId(null);
    setClubDiscussions([]);
  };

  const createGamingClub = async () => {
    const name = newClubName.trim();
    const description =
      newClubDescription.trim() ||
      `A GamingVerse community for ${newClubInterest} gamers.`;

    if (!name || !auth.currentUser) return;

    const uid = auth.currentUser.uid;
    try {
      const clubRef = push(ref(db, "clubs"));
      await set(clubRef, {
        name,
        interest: newClubInterest,
        description,
        accent: getClubInterestMeta(newClubInterest).color,
        ownerUid: uid,
        memberCount: 1,
        createdAt: serverTimestamp(),
      });
      await set(ref(db, `userClubs/${uid}/${clubRef.key}`), true);
      setSelectedClubId(clubRef.key);
    } catch (error) {
      console.error("Create club error:", error);
    }

    setNewClubName("");
    setNewClubInterest("Action");
    setNewClubDescription("");
    setShowCreateClub(false);
  };

  const postClubDiscussion = async () => {
    const text = clubPost.trim();
    if (!text || !selectedClubId || !auth.currentUser) return;

    try {
      await push(ref(db, `clubDiscussions/${selectedClubId}`), {
        title: text,
        author:
          auth.currentUser.displayName ||
          auth.currentUser.email?.split("@")[0] ||
          "Gamer",
        authorUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setClubPost("");
    } catch (error) {
      console.error("Post club discussion error:", error);
    }
  };

  const postCommunityTalk = async () => {
    const text = communityTalkPost.trim();
    if (!text || !auth.currentUser) return;

    try {
      await push(ref(db, "communityTalks"), {
        title: text,
        author:
          auth.currentUser.displayName ||
          auth.currentUser.email?.split("@")[0] ||
          "Gamer",
        authorUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setCommunityTalkPost("");
    } catch (error) {
      console.error("Post community talk error:", error);
    }
  };

  const filteredGamingClubs = useMemo(() => {
    const searchText = clubSearch.trim().toLowerCase();

    return gamingClubs.filter((club) => {
      const matchesInterest =
        clubInterest === "All" || club.interest === clubInterest;
      const matchesSearch =
        !searchText ||
        club.name.toLowerCase().includes(searchText) ||
        club.description.toLowerCase().includes(searchText);
      return matchesInterest && matchesSearch;
    });
  }, [gamingClubs, clubInterest, clubSearch]);

  return {
    gamingClubs,
    selectedClubId,
    setSelectedClubId,
    joinedClubIds,
    clubInterest,
    setClubInterest,
    clubSearch,
    setClubSearch,
    showCreateClub,
    setShowCreateClub,
    newClubName,
    setNewClubName,
    newClubInterest,
    setNewClubInterest,
    newClubDescription,
    setNewClubDescription,
    clubPost,
    setClubPost,
    communityTalkPost,
    setCommunityTalkPost,
    communityTalks,
    clubDiscussions,
    openClub,
    toggleClubMembership,
    leaveClub,
    closeClub,
    createGamingClub,
    postClubDiscussion,
    postCommunityTalk,
    filteredGamingClubs,
  };
}
