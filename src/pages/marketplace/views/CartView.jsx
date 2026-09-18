/* =========================================================
   CART
   Rendered by ../../Marketplace.jsx.
========================================================= */

import { money } from "../utils/format.js";

export default function CartView({
  cart,
  delivery,
  navigate,
  removeCartItem,
  subtotal,
  total,
  updateCart,
}) {
  const renderCart = () => (
    <section className="section-page">
      <button className="back-btn" onClick={() => navigate("products")}>
        ← Marketplace
      </button>

      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-state">
          <div>🛒</div>
          <h3>Cart is empty</h3>
          <button className="primary-btn" onClick={() => navigate("products")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((item) => (
              <div className="cart-item" key={item.productId}>
                <div className="cart-image">
                  {item.image ? <img src={item.image} alt={item.name} /> : "🎮"}
                </div>

                <div className="cart-info">
                  <h3>{item.name}</h3>

                  <p>{item.platform}</p>

                  <strong>{money(item.price)}</strong>
                </div>

                <div className="quantity">
                  <button
                    onClick={() =>
                      updateCart(item.productId, Number(item.quantity) - 1)
                    }
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateCart(item.productId, Number(item.quantity) + 1)
                    }
                  >
                    +
                  </button>
                </div>

                <strong>
                  {money(Number(item.price) * Number(item.quantity))}
                </strong>

                <button
                  className="danger-link"
                  onClick={() => removeCartItem(item.productId)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <aside className="summary-card">
            <h3>Order Summary</h3>

            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <div>
              <span>Delivery</span>
              <strong>{delivery === 0 ? "FREE" : money(delivery)}</strong>
            </div>

            <hr />

            <div className="total-row">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            <button
              className="primary-btn full"
              onClick={() => navigate("checkout")}
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  );

  return renderCart();
}
