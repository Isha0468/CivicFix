const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['Reported', 'Verified', 'Assigned', 'Accepted', 'In Progress', 'Resolved', 'Closed', 'Rejected']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  images: [{
    type: String
  }]
});

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen reference is required']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required']
    },
    status: {
      type: String,
      enum: ['Reported', 'Verified', 'Assigned', 'Accepted', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
      default: 'Reported'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates [longitude, latitude] are required']
      }
    },
    address: {
      type: String,
      required: [true, 'Address string is required'],
      trim: true
    },
    images: [{
      type: String // Cloudinary URLs or local disk paths
    }],
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    timeline: [timelineSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Geo-spatial index for maps and duplicate checking
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1 });
complaintSchema.index({ citizen: 1 });
complaintSchema.index({ assignedOfficer: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });

// Virtual for Upvote Count
complaintSchema.virtual('upvoteCount').get(function () {
  return this.upvotes ? this.upvotes.length : 0;
});

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
