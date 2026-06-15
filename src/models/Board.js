import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// ─── Board Schema ──────────────────────────────────────────────────────────────
const boardSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    image: {
      public_id: {
        type: String,
        default: '',
      },
      url: {
        type: String,
        default: '',
      },
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Board must have a creator'],
      index: true,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
boardSchema.index({ title: 'text', description: 'text' });
boardSchema.index({ createdBy: 1, createdAt: -1 });
boardSchema.index({ members: 1, createdAt: -1 });
boardSchema.index({ createdAt: -1 });

// ─── Pre-save Hook: auto-add creator → members (no duplicates) ─────────────────
boardSchema.pre('save', function () {
  const creatorId = this.createdBy?.toString();
  if (creatorId) {
    const alreadyMember = this.members.some((m) => m.toString() === creatorId);
    if (!alreadyMember) {
      this.members.unshift(this.createdBy); // ensure creator is first member
    }
  }
  // Deduplicate members array
  const seen = new Set();
  this.members = this.members.filter((m) => {
    const id = m.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
});


// ─── Instance Method: check if a user is a member ─────────────────────────────
boardSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.toString() === userId.toString());
};

// ─── Instance Method: check if a user is the owner ────────────────────────────
boardSchema.methods.isOwner = function (userId) {
  return this.createdBy.toString() === userId.toString();
};

// ─── Populate helper (reused across controllers) ──────────────────────────────
export const BOARD_POPULATE = [
  {
    path: 'createdBy',
    select: 'name email avatar',
  },
  {
    path: 'members',
    select: 'name email avatar role',
  },
];

export const Board = model('Board', boardSchema);
export default Board;
