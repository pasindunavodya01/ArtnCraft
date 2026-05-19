import Auction from '../models/Auction.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

export async function resolveAuctions() {
  try {
    const now = new Date();

    // 1. Activate pending auctions whose startTime has arrived
    const toActivate = await Auction.find({
      status: 'pending',
      startTime: { $lte: now }
    });

    for (const auction of toActivate) {
      auction.status = 'active';
      await auction.save();
      console.log(`[AuctionScheduler] Activated auction ${auction._id} for product ${auction.productId}`);
    }

    // 2. Resolve active/pending auctions whose endTime has arrived
    const toEnd = await Auction.find({
      status: { $in: ['pending', 'active'] },
      endTime: { $lte: now }
    });

    for (const auction of toEnd) {
      console.log(`[AuctionScheduler] Resolving ended auction ${auction._id}`);
      auction.status = 'ended';

      if (auction.bids && auction.bids.length > 0) {
        // Sort bids by amount descending
        const sortedBids = [...auction.bids].sort((a, b) => b.amount - a.amount);
        const winningBid = sortedBids[0];

        // Check if reserve price is met
        const isReserveMet = !auction.reservePrice || winningBid.amount >= auction.reservePrice;

        if (isReserveMet) {
          const product = await Product.findById(auction.productId);
          if (product) {
            // Create a pending Order for the winner
            const order = await Order.create({
              customerEmail: winningBid.buyerEmail,
              customerName: winningBid.buyerName || winningBid.buyerEmail,
              items: [{
                productId: product._id,
                sellerEmail: product.sellerEmail,
                title: product.title,
                quantity: 1,
                price: winningBid.amount
              }],
              total: winningBid.amount,
              address: 'Pending Payment (Auction Win)',
              paymentMethod: 'bank-slip',
              paymentStatus: 'pending',
              sellerApprovals: [{
                sellerEmail: product.sellerEmail,
                status: 'pending'
              }]
            });

            auction.winnerEmail = winningBid.buyerEmail;
            auction.winnerName = winningBid.buyerName || winningBid.buyerEmail;
            auction.orderId = order._id;
            console.log(`[AuctionScheduler] Auction ${auction._id} won by ${winningBid.buyerEmail}. Order ${order._id} created.`);
          } else {
            console.warn(`[AuctionScheduler] Product ${auction.productId} not found for auction ${auction._id}`);
          }
        } else {
          console.log(`[AuctionScheduler] Auction ${auction._id} ended without winner. Reserve price of Rs.${auction.reservePrice} not met (Highest bid: Rs.${winningBid.amount}).`);
        }
      } else {
        console.log(`[AuctionScheduler] Auction ${auction._id} ended with no bids.`);
      }

      await auction.save();
    }
  } catch (error) {
    console.error('[AuctionScheduler] Error in background job:', error);
  }
}

export function startAuctionScheduler() {
  console.log('[AuctionScheduler] Background task runner initialized.');

  setInterval(async () => {
    await resolveAuctions();
  }, 10000); // Runs every 10 seconds for real-time transitions
}
