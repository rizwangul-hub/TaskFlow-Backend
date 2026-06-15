import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/user.model.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment');
  process.exit(1);
}

const usersToEnsure = [
  { name: 'Admin', email: 'admin@gmail.com', password: 'peral2426', role: 'admin' },
  { name: 'Manager', email: 'manager@gmail.com', password: 'peral2426', role: 'project_manager' },
];

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // keep defaults; options can be adjusted if needed
    });

    console.log('Connected to MongoDB');

    for (const u of usersToEnsure) {
      const existing = await User.findOne({ email: u.email }).exec();
      if (existing) {
        existing.role = u.role;
        existing.password = u.password; // will be hashed by pre-save hook
        await existing.save();
        console.log(`Updated user: ${u.email} (role -> ${u.role})`);
      } else {
        await User.create({ name: u.name, email: u.email, password: u.password, role: u.role });
        console.log(`Created user: ${u.email} (role -> ${u.role})`);
      }
    }

    console.log('Done');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating/updating users:', err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
})();
