import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import admin from 'firebase-admin';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce-demo';
const servicePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const defaultPassword = process.env.SEED_USER_PASSWORD || 'password123';

function loadServiceAccount() {
  if (serviceJson) {
    try {
      return JSON.parse(serviceJson);
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err);
      process.exit(1);
    }
  }

  if (servicePath) {
    try {
      const raw = fs.readFileSync(servicePath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read service account from path:', err);
      process.exit(1);
    }
  }

  console.error('Provide Firebase service account via FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON');
  process.exit(1);
}

async function run() {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const users = await User.find();
  console.log(`Found ${users.length} users in MongoDB`);

  let created = 0;
  for (const u of users) {
    try {
      await admin.auth().getUserByEmail(u.email);
      console.log(`Firebase user exists: ${u.email}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err?.errorInfo?.code === 'auth/user-not-found') {
        try {
          await admin.auth().createUser({
            email: u.email,
            emailVerified: false,
            password: defaultPassword,
            displayName: u.name,
            disabled: false
          });
          console.log(`Created Firebase user: ${u.email} (password: ${defaultPassword})`);
          created++;
        } catch (createErr) {
          console.error(`Failed to create Firebase user ${u.email}:`, createErr);
        }
      } else {
        console.error(`Failed to get Firebase user ${u.email}:`, err);
      }
    }
  }

  console.log(`Firebase seeding complete. Created ${created} users.`);
  await mongoose.disconnect();
  process.exit(0);
}

run();
