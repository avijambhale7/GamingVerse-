/* =========================================================
   ORDERS
   Order history with its delivery-status tracker.
   Rendered by ../../Marketplace.jsx.
========================================================= */

import React from "react";
import { ORDER_STEPS } from "../data/catalog.js";
import { money } from "../utils/format.js";

export default function OrdersView({
  cancelOrder,
  navigate,
  orders,
  user,
}) {
  const renderTracker = (status) => {
    const currentIndex = ORDER_STEPS.indexOf(status);

    return (
      <div className="tracker">
        {ORDER_STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={
                index <= currentIndex ? "tracker-step done" : "tracker-step"
              }
            >
              <div className="tracker-circle">
                {index <= currentIndex ? "✓" : index + 1}
              </div>

              <span>{step}</span>
            </div>

            {index < ORDER_STEPS.length - 1 && (
              <div
                className={
                  index < currentIndex ? "tracker-line done" : "tracker-line"
                }
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderOrders = () => {
    if (!user) {
      return (
        <div className="empty-state">
          <div>🔐</div>
          <h3>Login required</h3>
        </div>
      );
    }

    const myOrders = orders.filter((order) => order.buyerId === user.uid);

    return (
      <section className="section-page">
        <h2>My Orders</h2>

        {myOrders.length === 0 ? (
          <div className="empty-state">
            <div>📦</div>
            <h3>No orders yet</h3>

            <button
              className="primary-btn"
              onClick={() => navigate("products")}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {myOrders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-top">
                  <div>
                    <small>ORDER #{order.orderNumber}</small>

                    <h3>{money(order.total)}</h3>
                  </div>

                  <strong>{order.orderStatus}</strong>
                </div>

                {renderTracker(order.orderStatus)}

                <div className="ordered-items">
                  {(order.items || []).map((item, index) => (
                    <div key={item.productId + index}>
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <strong>
                        {money(Number(item.price) * Number(item.quantity))}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="order-bottom">
                  <span>Payment: {order.paymentMethod}</span>

                  {!["Cancelled", "Shipped", "Delivered"].includes(
                    order.orderStatus,
                  ) && (
                    <button
                      className="danger-btn"
                      onClick={() => cancelOrder(order)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return renderOrders();
}
