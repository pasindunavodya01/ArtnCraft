import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyFirebaseToken, isFirebaseAdminAvailable } from '../utils/firebaseAdmin.js';

async function attachUserFromDb(req) {
  const email = req.user?.email?.toLowerCase?.()?.trim();
  if (!email) return;
  const dbUser = await User.findOne({ email }).select('role name _id');
  if (dbUser) {
    req.user.role = dbUser.role;
    req.user.id = req.user.id || dbUser._id;
    req.user.name = req.user.name || dbUser.name;
  }
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  if (isFirebaseAdminAvailable()) {
    try {
      const decoded = await verifyFirebaseToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email,
      };
      await attachUserFromDb(req);
      return next();
    } catch (firebaseError) {
      console.warn('Firebase token verification failed:', firebaseError.message);
    }
  }

  if (process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      await attachUserFromDb(req);
      return next();
    } catch {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  }

  return res.status(403).json({ message: 'Invalid or expired token' });
}
