/* Full-screen "Loading GamingVerse..." shown while auth state or a
   lazily-loaded page is on its way. Used by App.jsx and Login.jsx. */

const PAGE_LOADING_STYLE = {
  minHeight: "100vh",
  background: "#000",
  color: "white",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "20px",
};

export default function PageLoading() {
  return <div style={PAGE_LOADING_STYLE}>Loading GamingVerse...</div>;
}
