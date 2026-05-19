import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Auction from '../models/Auction.js';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce-demo';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to Mongo for seeding auctions');

    // Clean existing auctions to prevent pollution
    await Auction.deleteMany({});
    console.log('Cleared existing auctions');

    // Get a few products
    const products = await Product.find({}).limit(5);
    if (products.length < 4) {
      console.error('Not enough products. Please run npm run seed first');
      return;
    }

    const customers = await User.find({ role: 'customer' }).limit(3);
    if (customers.length < 2) {
      console.error('Not enough customers. Please run npm run seed first');
      return;
    }

    const now = new Date();

    // 1. LIVE AUCTION (Active)
    const activeStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const activeEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
    
    await Auction.create({
      productId: products[0]._id,
      sellerEmail: products[0].sellerEmail || 'seller1@example.com',
      startingBid: 300,
      reservePrice: 450,
      startTime: activeStart,
      endTime: activeEnd,
      status: 'active',
      highestBid: 420,
      highestBidder: customers[0].email,
      bids: [
        {
          buyerEmail: customers[1].email,
          buyerName: customers[1].name,
          amount: 320,
          timestamp: new Date(now.getTime() - 1.5 * 60 * 60 * 1000)
        },
        {
          buyerEmail: customers[0].email,
          buyerName: customers[0].name,
          amount: 420,
          timestamp: new Date(now.getTime() - 30 * 60 * 1000)
        }
      ]
    });
    console.log(`Created Live Auction: ${products[0].title}`);

    // 2. UPCOMING AUCTION (Pending)
    const upcomingStart = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now
    const upcomingEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

    await Auction.create({
      productId: products[1]._id,
      sellerEmail: products[1].sellerEmail || 'seller1@example.com',
      startingBid: 500,
      reservePrice: 700,
      startTime: upcomingStart,
      endTime: upcomingEnd,
      status: 'pending',
      highestBid: 0,
      bids: []
    });
    console.log(`Created Upcoming Auction: ${products[1].title}`);

    // 3. EXPIRING SOON AUCTION (Ends in 25 seconds - to test real-time scheduler resolution)
    const soonStart = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    const soonEnd = new Date(now.getTime() + 25 * 1000); // 25 seconds from now

    await Auction.create({
      productId: products[2]._id,
      sellerEmail: products[2].sellerEmail || 'seller1@example.com',
      startingBid: 150,
      reservePrice: 200,
      startTime: soonStart,
      endTime: soonEnd,
      status: 'active',
      highestBid: 250,
      highestBidder: customers[1].email,
      bids: [
        {
          buyerEmail: customers[0].email,
          buyerName: customers[0].name,
          amount: 180,
          timestamp: new Date(now.getTime() - 4 * 60 * 1000)
        },
        {
          buyerEmail: customers[1].email,
          buyerName: customers[1].name,
          amount: 250,
          timestamp: new Date(now.getTime() - 2 * 60 * 1000)
        }
      ]
    });
    console.log(`Created Expiring Auction (Ends in 25s): ${products[2].title}`);

    // 4. COMPLETED AUCTION (Ended, no reserve met - reserve was 1000, max bid was 600)
    const completedStart = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
    const completedEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

    await Auction.create({
      productId: products[3]._id,
      sellerEmail: products[3].sellerEmail || 'seller1@example.com',
      startingBid: 400,
      reservePrice: 1000,
      startTime: completedStart,
      endTime: completedEnd,
      status: 'ended',
      highestBid: 600,
      highestBidder: customers[0].email,
      bids: [
        {
          buyerEmail: customers[0].email,
          buyerName: customers[0].name,
          amount: 600,
          timestamp: new Date(now.getTime() - 30 * 60 * 60 * 1000)
        }
      ]
    });
    console.log(`Created Completed Auction (Reserve Unmet): ${products[3].title}`);

    console.log('Auctions seeding complete!');
  } catch (err) {
    console.error('Auctions seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
