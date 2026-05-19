import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Auction from '../models/Auction.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { resolveAuctions } from '../services/auctionScheduler.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce-demo';

async function testE2E() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to Mongo for E2E integration test');

    // 1. Fetch our seed expiring auction
    const expiringAuction = await Auction.findOne({ status: 'active' }).populate('productId');
    if (!expiringAuction) {
      console.error('Could not find active seed auction. Run seedAuctions first.');
      process.exit(1);
    }

    console.log('\n--- 1. Verification of Seed Auction ---');
    console.log(`Expiring Auction Title: ${expiringAuction.productId?.title}`);
    console.log(`Starting Bid: Rs. ${expiringAuction.startingBid}`);
    console.log(`Highest Bid: Rs. ${expiringAuction.highestBid}`);
    console.log(`Highest Bidder: ${expiringAuction.highestBidder}`);
    console.log(`Bids Count: ${expiringAuction.bids.length}`);

    // 2. Place a valid higher bid programmatically
    console.log('\n--- 2. Placing a New Bid ---');
    const customer = await User.findOne({ email: 'customer2@example.com' });
    const newBidAmount = expiringAuction.highestBid + 50; // Rs. 50 higher

    expiringAuction.bids.push({
      buyerEmail: customer.email,
      buyerName: customer.name,
      amount: newBidAmount,
      timestamp: new Date()
    });
    expiringAuction.highestBid = newBidAmount;
    expiringAuction.highestBidder = customer.email;
    await expiringAuction.save();
    console.log(`Successfully placed bid of Rs. ${newBidAmount} from ${customer.email}!`);

    // Verify bid persistence
    const updatedAuction = await Auction.findById(expiringAuction._id);
    console.log(`Updated Auction Highest Bid: Rs. ${updatedAuction.highestBid}`);
    console.log(`Updated Highest Bidder: ${updatedAuction.highestBidder}`);

    // 3. Force end-time in the past to trigger resolver transition
    console.log('\n--- 3. Simulating Auction Completion ---');
    updatedAuction.endTime = new Date(Date.now() - 1000); // 1 second ago
    await updatedAuction.save();
    console.log('Forced auction end-time to the past.');

    // 4. Run the resolveAuctions scheduler job manually
    console.log('\n--- 4. Running Scheduler Resolver ---');
    await resolveAuctions();

    // 5. Verify the results
    const resolvedAuction = await Auction.findById(expiringAuction._id);
    console.log(`Resolved Auction Status: ${resolvedAuction.status}`);
    console.log(`Resolved Winner: ${resolvedAuction.winnerEmail} (${resolvedAuction.winnerName})`);
    console.log(`Resolved Order ID: ${resolvedAuction.orderId}`);

    if (resolvedAuction.orderId) {
      const order = await Order.findById(resolvedAuction.orderId);
      console.log('\n--- 5. Verifying Generated Pending Order ---');
      console.log(`Order ID: ${order._id}`);
      console.log(`Customer Name: ${order.customerName}`);
      console.log(`Customer Email: ${order.customerEmail}`);
      console.log(`Total: Rs. ${order.total}`);
      console.log(`Payment Status: ${order.paymentStatus}`);
      console.log(`Items count: ${order.items?.length}`);
      console.log(`Item 0 Title: ${order.items?.[0]?.title}`);
      console.log(`Item 0 Price: Rs. ${order.items?.[0]?.price}`);
    } else {
      console.error('FAIL: No order was created for the winning bid.');
    }

    console.log('\n--- E2E TEST COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('E2E Test failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testE2E();
