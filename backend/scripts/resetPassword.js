// Script one-shot pour réinitialiser les mots de passe corrompus (double hash)
// Usage: node backend/scripts/resetPassword.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// ── USERS À RESET ──
// Ajoutez ici chaque user dont le login ne fonctionne plus
const usersToReset = [
  { email: 'moez@gmail.com', newPassword: 'moez' },
  // Ajoutez d'autres si nécessaire :
  // { email: 'admin@gmail.com', newPassword: 'admin' },
];

async function resetPasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const UserSchema = new mongoose.Schema({
      email: String,
      password: String,
      name: String,
      role: String,
    });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    for (const { email, newPassword } of usersToReset) {
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User ${email} non trouvé`);
        continue;
      }

      // Hash proprement UNE SEULE FOIS
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);

      // Update directement (bypass le hook pre('save') pour éviter un re-hash)
      await User.updateOne({ email }, { $set: { password: hashed } });
      
      // Vérification
      const verify = await bcrypt.compare(newPassword, hashed);
      console.log(`✅ ${email} (${user.role}) — Password reset OK — Verify: ${verify}`);
    }

    await mongoose.disconnect();
    console.log('\n🎉 Terminé. Vous pouvez maintenant vous connecter.');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

resetPasswords();
