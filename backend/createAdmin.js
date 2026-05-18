import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import connectDB from './db.js';

connectDB();

const createAdmin = async () => {
  try {
    const existing = await User.findOne({ email: 'admin@ksi.tn' });
    if (existing) {
      console.log('Admin déjà existant !');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const admin = new User({
      name: 'ADMINISTRATEUR KSI',
      email: 'admin@ksi.tn',
      password: hashedPassword,
      role: 'ADMIN',
      company: 'KSI SECURITY',
      status: 'ACTIVE',
      mfaEnabled: false,
    });

    await admin.save();
    console.log('✅ Admin créé avec succès !');
    console.log('Email: admin@ksi.tn');
    console.log('Password: admin');
    process.exit();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
};

createAdmin();