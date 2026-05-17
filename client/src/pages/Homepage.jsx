import { useEffect, useState } from 'react';
import api from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Homepage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productForm, setProductForm] = useState({ title: '', description: '', category: '', price: '', image: null });
  const [success, setSuccess] = useState('');
  const { addToCart } = useCart();
  const { role, user } = useAuth();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (err) {
        setError('Unable to load products.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAdd = (product) => addToCart(product);

  const handleInput = (event) => {
    const { name, value, files } = event.target;
    if (name === 'image') {
      setProductForm((prev) => ({ ...prev, image: files?.[0] || null }));
      return;
    }
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    if (!productForm.image) {
      setError('Please choose an image for the product.');
      return;
    }

    const formData = new FormData();
    formData.append('title', productForm.title);
    formData.append('description', productForm.description);
    formData.append('category', productForm.category);
    formData.append('price', productForm.price);
    formData.append('image', productForm.image);

    try {
      const token = authTokenFromStorage();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      const response = await api.post('/products/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProducts((prev) => [response.data, ...prev]);
      setSuccess('Product added successfully.');
      setProductForm({ title: '', description: '', category: '', price: '', image: null });
    } catch (err) {
      setError('Unable to add product. Ensure you are logged in as a seller.');
    }
  };

  const authTokenFromStorage = () => localStorage.getItem('ecommerce-api-token');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl font-bold sm:text-5xl">Summer Mega Sale</h1>
              <p className="mt-4 text-lg text-red-50">Up to 70% off on our best sellers!</p>
              <p className="mt-2 text-sm text-red-100">Limited time offer - Shop now and save big</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#products" className="rounded-md bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-gray-50">
                  Shop Now
                </a>
                {!user && (
                  <a href="/register" className="rounded-md border-2 border-white px-6 py-3 font-bold text-white transition hover:bg-white hover:text-red-600">
                    Sign Up
                  </a>
                )}
              </div>
            </div>
            <div className="rounded-lg overflow-hidden bg-white p-6 shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-2xl font-bold text-red-600">{products.length}</p>
                  <p className="text-sm text-gray-600">Products</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-2xl font-bold text-red-600">{user ? role.charAt(0).toUpperCase() + role.slice(1) : 'Join'}</p>
                  <p className="text-sm text-gray-600">Your Role</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Seller Dashboard */}
        {role === 'seller' && (
          <div className="mb-12 rounded-lg border border-gray-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Upload New Product</h2>
            <p className="mt-2 text-gray-600">Add your products to our marketplace</p>
            <form onSubmit={handleProductSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                name="title"
                value={productForm.title}
                onChange={handleInput}
                placeholder="Product title"
                required
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="category"
                value={productForm.category}
                onChange={handleInput}
                placeholder="Category"
                required
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="price"
                value={productForm.price}
                onChange={handleInput}
                placeholder="Price"
                type="number"
                required
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="image"
                onChange={handleInput}
                type="file"
                accept="image/*"
                required
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <textarea
                name="description"
                value={productForm.description}
                onChange={handleInput}
                rows="4"
                placeholder="Product description"
                required
                className="col-span-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              ></textarea>
              <button
                type="submit"
                className="col-span-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700"
              >
                Upload Product
              </button>
            </form>
            {success && <p className="mt-4 rounded-lg bg-green-50 p-3 text-green-800">{success}</p>}
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
          </div>
        )}

        {/* Products Section */}
        <section id="products">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <p className="mt-2 text-gray-600">Discover our best-selling items</p>
          </div>

          {loading ? (
            <div className="mt-8 flex justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
                <p className="mt-4 text-gray-600">Loading products…</p>
              </div>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-lg bg-red-50 p-12 text-center text-red-800">{error}</div>
          ) : products.length === 0 ? (
            <div className="mt-8 text-center py-12">
              <p className="text-gray-600">No products available yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} onAdd={handleAdd} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
