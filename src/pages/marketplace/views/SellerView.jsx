/* =========================================================
   SELLER DASHBOARD
   Listing form, inventory and incoming customer orders.
   Rendered by ../../Marketplace.jsx.
========================================================= */

import { useState } from "react";
import { EMPTY_PRODUCT } from "../data/catalog.js";
import { money } from "../utils/format.js";
import ImageUploadButton from "../../../components/ImageUploadButton.jsx";
import PurchaseRequestList from "../../../components/PurchaseRequestList.jsx";
import usePurchaseRequests from "../../../utils/usePurchaseRequests.js";
import { REQUEST_STATUS } from "../../../utils/purchaseRequests.js";

export default function SellerView({
  deleteProduct,
  editProduct,
  editingId,
  notify,
  products,
  saveProduct,
  sellerForm,
  setEditingId,
  setSellerForm,
  user,
}) {
  const [imageUploadError, setImageUploadError] = useState("");
  const { requests } = usePurchaseRequests("seller", user?.uid);
  const pendingRequests = requests.filter(
    (request) => request.status === REQUEST_STATUS.PENDING_SELLER,
  ).length;

  const renderSeller = () => {
    if (!user) {
      return (
        <div className="empty-state">
          <div>🔐</div>
          <h3>Login required</h3>
        </div>
      );
    }

    const myProducts = products.filter(
      (product) => product.sellerId === user.uid && !product.demo,
    );


    return (
      <section className="section-page">
        <div className="seller-title">
          <div>
            <span className="hero-badge">SHOP OWNER</span>

            <h2>Seller Dashboard</h2>

            <p>Add CDs, manage stock and respond to buyer requests.</p>
          </div>

          <div className="seller-stats">
            <div>
              <strong>{myProducts.length}</strong>
              <span>Products</span>
            </div>

            <div>
              <strong>{pendingRequests}</strong>
              <span>New Requests</span>
            </div>
          </div>
        </div>

        <div className="seller-grid">
          <form className="form-card" onSubmit={saveProduct}>
            <h3>{editingId ? "Edit CD" : "Add Gaming CD"}</h3>

            <div className="form-grid">
              <label className="full">
                Game Name *
                <input
                  value={sellerForm.name}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="GTA V"
                />
              </label>

              <label>
                Platform
                <select
                  value={sellerForm.platform}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      platform: e.target.value,
                    }))
                  }
                >
                  <option>PS5</option>
                  <option>PS4</option>
                  <option>Xbox</option>
                  <option>PC</option>
                </select>
              </label>

              <label>
                Category
                <select
                  value={sellerForm.category}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option>Action</option>
                  <option>Adventure</option>
                  <option>RPG</option>
                  <option>Racing</option>
                  <option>Sports</option>
                </select>
              </label>

              <label>
                Condition
                <select
                  value={sellerForm.condition}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      condition: e.target.value,
                    }))
                  }
                >
                  <option>New</option>
                  <option>Used</option>
                </select>
              </label>

              <label>
                Price *
                <input
                  type="number"
                  min="1"
                  value={sellerForm.price}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Stock *
                <input
                  type="number"
                  min="1"
                  value={sellerForm.stock}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      stock: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="full">
                Image
                <div className="image-field-row">
                  <input
                    value={sellerForm.image}
                    onChange={(e) =>
                      setSellerForm((prev) => ({
                        ...prev,
                        image: e.target.value,
                      }))
                    }
                    placeholder="Paste a URL, or upload a photo →"
                  />
                  {user && (
                    <ImageUploadButton
                      pathPrefix={`productImages/${user.uid}`}
                      label="Upload"
                      onUploaded={(url) =>
                        setSellerForm((prev) => ({ ...prev, image: url }))
                      }
                      onError={setImageUploadError}
                    />
                  )}
                </div>
                {sellerForm.image && (
                  <img
                    src={sellerForm.image}
                    alt=""
                    className="image-field-preview"
                  />
                )}
                {imageUploadError && (
                  <small className="image-field-error">
                    {imageUploadError}
                  </small>
                )}
              </label>

              <label className="full">
                Description
                <textarea
                  rows="4"
                  value={sellerForm.description}
                  onChange={(e) =>
                    setSellerForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button className="primary-btn full" type="submit">
              {editingId ? "Update Product" : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn full cancel-edit"
                onClick={() => {
                  setEditingId(null);
                  setSellerForm(EMPTY_PRODUCT);
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>

          <div className="form-card">
            <h3>My Products</h3>

            {myProducts.length === 0 ? (
              <div className="seller-empty">No products added.</div>
            ) : (
              <div className="seller-products">
                {myProducts.map((product) => (
                  <div className="seller-row" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>

                      <span>
                        {product.platform}
                        {" • "}
                        {money(product.price)}
                      </span>

                      <small>Stock: {product.stock}</small>
                    </div>

                    <button
                      className="secondary-btn"
                      onClick={() => editProduct(product)}
                    >
                      Edit
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => deleteProduct(product)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-card seller-orders">
          <h3>Buyer Requests</h3>
          <p className="requests-intro">
            Requests reach you after the admin approves them. Accept one to
            see the buyer&apos;s mobile number.
          </p>
          <PurchaseRequestList role="seller" uid={user.uid} onMessage={notify} />
        </div>
      </section>
    );
  };

  return renderSeller();
}
