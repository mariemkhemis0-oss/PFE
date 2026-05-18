import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB Connection...');
console.log('URI:', mongoUri ? mongoUri.substring(0, 50) + '...' : 'NOT SET');

if (!mongoUri) {
  console.error('❌ MONGODB_URI is not set in .env file');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Connection Error:', error.message);
    console.error('Full Error:', error);
    process.exit(1);
  });
