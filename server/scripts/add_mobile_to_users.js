import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce-demo';

function generateMobileNumber(index) {
  const phone = String(1000000000 + index).slice(-10);
  return `+1${phone}`;
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to Mongo for mobile seeding');

    const users = await User.find({ $or: [{ mobile: { $exists: false } }, { mobile: null }, { mobile: '' }] });
    console.log(`Found ${users.length} users without mobile`);

    let count = 0;
    for (const [index, user] of users.entries()) {
      const mobile = generateMobileNumber(index + 1);
      await User.updateOne({ _id: user._id }, { mobile });
      console.log(`Updated ${user.email} -> ${mobile}`);
      count += 1;
    }

    console.log(`Mobile update complete. ${count} users updated.`);
  } catch (error) {
    console.error('Mobile seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
