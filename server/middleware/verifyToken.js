import jwt from 'jsonwebtoken';
import { verifyFirebaseToken, isFirebaseAdminAvailable } from '../utils/firebaseAdmin.js';

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
      return next();
    } catch (firebaseError) {
      console.warn('Firebase token verification failed:', firebaseError.message);
    }
  }

  if (process.env.JWT_SECRET) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      req.user = decoded;
      next();
    });
    return;
  }

  return res.status(403).json({ message: 'Invalid or expired token' });
}
