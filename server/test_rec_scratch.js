import 'dotenv/config';
import mongoose from 'mongoose';
import { getRecommendationsForUser } from './services/recommendationService.js';
import User from './models/User.js';
import UserInteraction from './models/UserInteraction.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce-demo';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    const users = await User.find({});
    console.log(`Found ${users.length} users. Testing recommendations for each...`);
    
    for (const user of users) {
      const viewCount = await UserInteraction.countDocuments({ userEmail: new RegExp(`^${user.email}$`, 'i'), type: 'view' });
      const res = await getRecommendationsForUser(user.email, { limit: 8 });
      console.log(`User: ${user.email} | Role: ${user.role} | Views: ${viewCount} | Recs: ${res.recommendations?.length} | HasActivity: ${res.hasActivity}`);
      if (res.recommendations?.length === 0) {
        console.warn(`⚠️ USER ${user.email} HAS 0 RECOMMENDATIONS!`);
      }
    }
  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
