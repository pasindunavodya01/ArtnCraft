# ArtNcraft E-Commerce Platform

This project is a full-stack e-commerce platform for art and craft products, featuring user authentication, product management, auctions, cart, orders, reviews, wishlists, and admin/seller dashboards. It is built with a React frontend and a Node.js/Express backend, using Firebase for authentication Cloudinary for image storage, and Stripe for payments.

## Features

### User Features
- **Authentication**: Register, login, and manage accounts with Firebase Auth
- **Product Browsing**: View products, search, and filter
- **Product Details**: See detailed product info, images, and reviews
- **Cart Management**: Add, update, and remove items from cart
- **Wishlist**: Add/remove products to wishlist
- **Checkout & Payment**: Secure checkout with Stripe integration
- **Order Management**: View order history and order details
- **Auctions**: Participate in live auctions, bid on products, view auction details
- **Reviews**: Submit and view product reviews
- **Account Management**: Update profile, view account info

### Seller Features
- **Seller Dashboard**: Manage own products and auctions
- **Product Management**: Add, edit, delete products
- **Auction Management**: Create and manage auctions for products
- **Order Management**: View orders for own products

### Admin Features
- **Admin Dashboard**: Overview of platform activity
- **User Management**: View, edit, and remove users
- **Product & Auction Oversight**: Manage all products and auctions
- **Reports & Analytics**: View reports, handle user reports
- **Recommendation System**: Manage and view recommendations

### Additional Features
- **Recommendation System**: Personalized product recommendations
- **Cloudinary Integration**: Image uploads and management
- **Firebase Admin**: Secure backend operations
- **Tailwind CSS**: Modern, responsive UI
- **Vite**: Fast frontend development

## Project Structure

```
client/           # React frontend
  src/
    components/   # Reusable UI components
    contexts/     # React context providers (Auth, Cart)
    pages/        # Main app pages (Home, Product, Cart, etc.)
    services/     # API service layer
    utils/        # Utility functions
  ...

server/           # Node.js/Express backend
  models/         # Mongoose models
  routes/         # Express routes
  middleware/     # Auth and admin middleware
  services/       # Business logic (auctions, recommendations)
  scripts/        # Seed and utility scripts
  utils/          # Utility modules (cloudinary, firebase)
  ...
```

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- Firebase project & credentials
- Stripe account & keys
- Cloudinary account (for image uploads)

### Setup
1. Clone the repository
2. Install dependencies in both `client` and `server` folders:
   ```sh
   cd client && npm install
   cd ../server && npm install
   ```
3. Set up environment variables (see `.env.example` in both folders)
4. Start the backend:
   ```sh
   cd server
   npm start
   ```
5. Start the frontend:
   ```sh
   cd client
   npm run dev
   ```

## Scripts
- `client/`
  - `npm run dev` — Start React frontend (Vite)
- `server/`
  - `npm start` — Start backend server
  - `npm run seed` — Seed database with sample data

## Technologies Used
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Image Storage**: Cloudinary
- **Other**: REST API, Context API

