import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce-demo';

const categories = ['Paintings', 'Sketches', 'Sculptures', 'Digital Art', 'Mixed Media', 'Prints'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randPrice(min = 20, max = 2000) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

async function createUsers() {
  const customers = [];
  const sellers = [];

  // create 20 customers
  for (let i = 1; i <= 20; i++) {
    const email = `customer${i}@example.com`;
    let user = await User.findOne({ email });
    if (!user) {
      const password = await bcrypt.hash('password123', 10);
      user = await User.create({ name: `Customer ${i}`, email, password, role: 'customer' });
    }
    customers.push(user);
  }

  // create 10 sellers
  for (let i = 1; i <= 10; i++) {
    const email = `seller${i}@example.com`;
    let user = await User.findOne({ email });
    if (!user) {
      const password = await bcrypt.hash('password123', 10);
      user = await User.create({ name: `Seller ${i}`, email, password, role: 'seller' });
    }
    sellers.push(user);
  }

  return { customers, sellers };
}

async function createProductsForSeller(seller, count = 12) {
  const products = [];
  for (let i = 1; i <= count; i++) {
    const title = `${randomFrom(['Autumn', 'Dawn', 'Murmur', 'Echo', 'Whisper', 'Rift', 'Harmony'])} ${randomFrom(['Landscape', 'Portrait', 'Abstract', 'Study', 'Composition'])} #${i}`;
    const category = randomFrom(categories);
    const description = `A ${category.toLowerCase()} by ${seller.name}. Crafted with care and attention to detail.`;
    const price = randPrice(50, 1500);
    const seed = encodeURIComponent(`${seller.email}-${i}`);
    const imageUrl = `https://picsum.photos/seed/${seed}/800/600`;

    // avoid duplicates by title + sellerEmail
    const existing = await Product.findOne({ title, sellerEmail: seller.email });
    let product;
    if (!existing) {
      product = await Product.create({ title, description, category, price, images: [imageUrl], sellerEmail: seller.email });
    } else {
      product = existing;
    }
    products.push(product);
  }
  return products;
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to Mongo for seeding');

    const { sellers } = await createUsers();
    console.log(`Ensured ${sellers.length} sellers`);

    let totalProducts = 0;
    for (const seller of sellers) {
      const created = await createProductsForSeller(seller, 12);
      totalProducts += created.length;
      console.log(`Seller ${seller.email}: ${created.length} products ensured`);
    }

    console.log(`Seeding complete: ${totalProducts} products`);
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
