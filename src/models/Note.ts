import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
  }],
}, { timestamps: true });

// Add index for userId to speed up queries
NoteSchema.index({ userId: 1 });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
