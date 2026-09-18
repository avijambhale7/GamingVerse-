/* =========================================================
   CHECKOUT
   Rendered by ../../Marketplace.jsx.
========================================================= */

import { money } from "../utils/format.js";

export default function CheckoutView({
  cart,
  checkout,
  delivery,
  navigate,
  placeOrder,
  setCheckoutField,
  subtotal,
  total,
}) {
  const renderCheckout = () => (
    <section className="section-page">
      <button className="back-btn" onClick={() => navigate("cart")}>
        ← Back to Cart
      </button>

      <h2>Checkout</h2>

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-left">
          <div className="form-card">
            <h3>Delivery Information</h3>

            <div className="form-grid">
              <label>
                Full Name *
                <input
                  value={checkout.fullName}
                  onChange={(e) => setCheckoutField("fullName", e.target.value)}
                />
              </label>

              <label>
                Mobile *
                <input
                  value={checkout.phone}
                  onChange={(e) => setCheckoutField("phone", e.target.value)}
                />
              </label>

              <label className="full">
                Address *
                <textarea
                  rows="3"
                  value={checkout.address}
                  onChange={(e) => setCheckoutField("address", e.target.value)}
                />
              </label>

              <label>
                City *
                <input
                  value={checkout.city}
                  onChange={(e) => setCheckoutField("city", e.target.value)}
                />
              </label>

              <label>
                State *
                <input
                  value={checkout.state}
                  onChange={(e) => setCheckoutField("state", e.target.value)}
                />
              </label>

              <label>
                Pincode *
                <input
                  maxLength="6"
                  value={checkout.pincode}
                  onChange={(e) =>
                    setCheckoutField(
                      "pincode",
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                />
              </label>
            </div>
          </div>

          <div className="form-card">
            <h3>Payment Method</h3>

            <label className="payment-option">
              <input
                type="radio"
                checked={checkout.paymentMethod === "COD"}
                onChange={() => setCheckoutField("paymentMethod", "COD")}
              />

              <div>
                <strong>Cash on Delivery</strong>

                <span>Pay after delivery.</span>
              </div>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                checked={checkout.paymentMethod === "Online Demo"}
                onChange={() =>
                  setCheckoutField("paymentMethod", "Online Demo")
                }
              />

              <div>
                <strong>Online Payment (Demo)</strong>

                <span>
                  Demo payment for college project. No real money is charged.
                </span>
              </div>
            </label>
          </div>
        </div>

        <aside className="summary-card">
          <h3>Order Summary</h3>

          {cart.map((item) => (
            <div className="summary-item" key={item.productId}>
              <span>
                {item.name} × {item.quantity}
              </span>

              <strong>
                {money(Number(item.price) * Number(item.quantity))}
              </strong>
            </div>
          ))}

          <hr />

          <div>
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div>
            <span>Delivery</span>
            <strong>{delivery === 0 ? "FREE" : money(delivery)}</strong>
          </div>

          <div className="total-row">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>

          <button type="submit" className="primary-btn full">
            Place Order
          </button>
        </aside>
      </form>
    </section>
  );

  return renderCheckout();
}
