import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        default: '',
      },
      url: {
        type: String,
        default: '',
      },
    },
    role: {
      type: String,
      enum: ['admin', 'project_manager', 'team_member'],
      default: 'team_member',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    archivedEmail: {
      type: String,
      select: false,
    },
    refreshTokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
userSchema.index({ role: 1, isDeleted: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: "text", email: "text" });

// Auto-hash password before saving to the database
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password in database
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate access token (contains userId and role)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      role: this.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRE,
    }
  );
};

// Generate password reset token (plain token returned, hash stored in DB)
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const expireMs =
    parseInt(process.env.RESET_PASSWORD_EXPIRE_MS, 10) || 10 * 60 * 1000;
  this.resetPasswordExpire = new Date(Date.now() + expireMs);

  return resetToken;
};

// Generate refresh token (contains userId + version for invalidation)
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      tokenVersion: this.refreshTokenVersion || 0,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE,
    }
  );
};

// Invalidate all outstanding refresh tokens
userSchema.methods.invalidateRefreshTokens = function () {
  this.refreshTokenVersion = (this.refreshTokenVersion || 0) + 1;
};

// Soft-delete user account
userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.archivedEmail = this.email;
  this.email = `deleted_${this._id}_${Date.now()}@taskflow.archived`;
  this.invalidateRefreshTokens();
  this.resetPasswordToken = undefined;
  this.resetPasswordExpire = undefined;
};

const User = mongoose.model('User', userSchema);

export { User };
export default User;
