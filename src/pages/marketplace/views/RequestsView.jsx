/* =========================================================
   MY REQUESTS
   The buyer's purchase requests and where each one stands.
   Rendered by ../../Marketplace.jsx.
========================================================= */

import PurchaseRequestList from "../../../components/PurchaseRequestList.jsx";
import usePurchaseRequests from "../../../utils/usePurchaseRequests.js";
import {
  REQUEST_STATUS,
  isOpenRequest,
} from "../../../utils/purchaseRequests.js";

const STEPS = [
  {
    icon: "📨",
    title: "Send a request",
    text: "Pick a product, choose quantity and add a note.",
  },
  {
    icon: "🛡️",
    title: "Admin approves",
    text: "Our team checks every request before it goes out.",
  },
  {
    icon: "🤝",
    title: "Seller accepts",
    text: "You both get each other's mobile number to close the deal.",
  },
];

export default function RequestsView({ navigate, notify, user }) {
  const data = usePurchaseRequests("buyer", user?.uid);

  if (!user) {
    return (
      <div className="empty-state">
        <div>🔐</div>
        <h3>Login required</h3>
      </div>
    );
  }

  const { requests } = data;
  const pending = requests.filter((r) => isOpenRequest(r.status)).length;
  const accepted = requests.filter(
    (r) => r.status === REQUEST_STATUS.ACCEPTED,
  ).length;

  return (
    <section className="section-page requests-page">
      <header className="requests-hero">
        <div className="requests-hero-copy">
          <span className="requests-hero-icon" aria-hidden="true">
            📨
          </span>
          <div>
            <span className="requests-kicker">YOUR PURCHASES</span>
            <h2>My Requests</h2>
            <p>
              Track every item you&apos;ve asked for. Once a seller accepts,
              their mobile number shows up right here.
            </p>
          </div>
        </div>

        <div className="requests-stats">
          <div className="is-pending">
            <strong>{pending}</strong>
            <span>In progress</span>
          </div>
          <div className="is-accepted">
            <strong>{accepted}</strong>
            <span>Accepted</span>
          </div>
          <div className="is-total">
            <strong>{requests.length}</strong>
            <span>Total</span>
          </div>
        </div>
      </header>

      <ol className="requests-steps" aria-label="How requests work">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <span className="requests-step-icon" aria-hidden="true">
              {step.icon}
            </span>
            <div>
              <small>STEP {index + 1}</small>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="requests-panel">
        <PurchaseRequestList
          role="buyer"
          uid={user.uid}
          data={data}
          onMessage={notify}
          emptyAction={{
            label: "🛍 Browse Marketplace",
            onClick: () => navigate("products"),
          }}
        />
      </div>
    </section>
  );
}
