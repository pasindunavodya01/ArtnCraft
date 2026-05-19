import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import Navbar from './components/Navbar.jsx';
import Homepage from './pages/Homepage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import SellerDashboard from './pages/SellerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import SellerProducts from './pages/SellerProducts.jsx';
import StripeSuccess from './pages/StripeSuccess.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Account from './pages/Account.jsx';
import AuctionList from './pages/AuctionList.jsx';
import AuctionDetail from './pages/AuctionDetail.jsx';
import PayExistingOrder from './pages/PayExistingOrder.jsx';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/seller/products" element={<SellerProducts />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/account" element={<Account />} />
              <Route path="/stripe-success" element={<StripeSuccess />} />
              <Route path="/auctions" element={<AuctionList />} />
              <Route path="/auctions/:id" element={<AuctionDetail />} />
              <Route path="/pay-order/:id" element={<PayExistingOrder />} />
            </Routes>
          </BrowserRouter>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
