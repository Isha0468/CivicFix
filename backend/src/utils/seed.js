require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix';
    await mongoose.connect(uri);
    console.log('Database connected for seeding.');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const categoriesSeed = [
  { name: 'Road Damage', description: 'Potholes, cracks, and road surface damage.', slug: 'road-damage' },
  { name: 'Street Light', description: 'Non-functional street lights and dark areas.', slug: 'street-light' },
  { name: 'Garbage', description: 'Accumulated garbage, littering, and unsanitary conditions.', slug: 'garbage' },
  { name: 'Water Leakage', description: 'Water main leaks and burst pipelines.', slug: 'water-leakage' },
  { name: 'Stray Animals', description: 'Stray dogs, monkeys, and aggressive animal complaints.', slug: 'stray-animals' },
  { name: 'Traffic Signal', description: 'Broken traffic lights and signal failures.', slug: 'traffic-signal' },
  { name: 'Illegal Dumping', description: 'Unauthorized dumping of garbage or debris.', slug: 'illegal-dumping' },
  { name: 'Fallen Trees', description: 'Blocked streets due to fallen trees or heavy branches.', slug: 'fallen-trees' },
  { name: 'Drainage', description: 'Clogged sewage drains, overflows, or flooding.', slug: 'drainage' },
  { name: 'Public Property Damage', description: 'Vandalism, broken park benches, and damage to amenities.', slug: 'public-property-damage' },
  { name: 'Other', description: 'General civic issues not matching other listings.', slug: 'other' }
];

const seedData = async () => {
  try {
    await connectDB();

    // 1. Clean Database
    console.log('Clearing old database records...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Complaint.deleteMany({});
    await Comment.deleteMany({});
    await Notification.deleteMany({});
    console.log('Database cleared.');

    // 2. Seed Categories
    console.log('Seeding categories...');
    const categories = await Category.insertMany(categoriesSeed);
    console.log(`${categories.length} categories seeded.`);

    const catRoad = categories.find(c => c.slug === 'road-damage');
    const catLight = categories.find(c => c.slug === 'street-light');
    const catGarbage = categories.find(c => c.slug === 'garbage');

    // 3. Seed Users (pre-save hashes the passwords)
    console.log('Seeding users...');
    const admin = await User.create({
      name: 'Isha',
      email: 'isha0468@gmail.com',
      password: 'password',
      role: 'Administrator',
      phone: '+15550100'
    });

    const officer = await User.create({
      name: 'Officer John Doe',
      email: 'officer@civicfix.com',
      password: 'officer123',
      role: 'Municipal Officer',
      phone: '+15550101',
      sector: 'North Zone',
      assignedArea: {
        name: 'Downtown Sector A',
        coordinates: [-73.935242, 40.730610]
      }
    });

    const officer2 = await User.create({
      name: 'Officer Jane Smith',
      email: 'officer2@civicfix.com',
      password: 'officer123',
      role: 'Municipal Officer',
      phone: '+15550103',
      sector: 'South Zone',
      assignedArea: {
        name: 'Downtown Sector B',
        coordinates: [-73.935242, 40.730610]
      }
    });

    const officer3 = await User.create({
      name: 'Officer Bob Johnson',
      email: 'officer3@civicfix.com',
      password: 'officer123',
      role: 'Municipal Officer',
      phone: '+15550104',
      sector: 'Central Zone',
      assignedArea: {
        name: 'Downtown Sector C',
        coordinates: [-73.935242, 40.730610]
      }
    });

    const citizen = await User.create({
      name: 'Jane Citizen',
      email: 'citizen@civicfix.com',
      password: 'citizen123',
      role: 'Citizen',
      phone: '+15550102'
    });

    console.log('Admin, Officer, and Citizen users created.');

    // 4. Seed Complaints
    console.log('Seeding complaints...');
    
    // Complaint 1: Reported Pothole (Reported Status)
    const complaint1 = await Complaint.create({
      title: 'Massive Pothole on Main Street',
      description: 'There is a huge pothole at the main crossing. It is about 10 inches deep and causing massive traffic jams as cars try to avoid it. It is very dangerous for motorbikes.',
      citizen: citizen._id,
      category: catRoad._id,
      status: 'Reported',
      location: {
        type: 'Point',
        coordinates: [-73.985428, 40.748817] // Empire State Building coords
      },
      address: '350 5th Ave, New York, NY 10118',
      severity: 'High',
      images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
      upvotes: [citizen._id],
      timeline: [{
        status: 'Reported',
        notes: 'Complaint submitted by citizen.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }]
    });

    // Complaint 2: In Progress Street Light (Assigned -> In Progress)
    const complaint2 = await Complaint.create({
      title: 'Broken Street Light near Central Park',
      description: 'The street lamp opposite the main park gate has been flickering for a week and has now gone completely dark. Pedestrians find it difficult to walk at night.',
      citizen: citizen._id,
      category: catLight._id,
      status: 'In Progress',
      location: {
        type: 'Point',
        coordinates: [-73.968285, 40.785091] // Central Park coords
      },
      address: 'Central Park West & 79th St, New York, NY 10024',
      severity: 'Medium',
      images: ['https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=800'],
      upvotes: [],
      assignedOfficer: officer._id,
      timeline: [
        {
          status: 'Reported',
          notes: 'Complaint reported by citizen.',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'Verified',
          officer: admin._id,
          notes: 'Verified. Located on municipal path.',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'Assigned',
          officer: admin._id,
          notes: 'Assigned to Officer John Doe for replacement.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'Accepted',
          officer: officer._id,
          notes: 'Accepted assignment. Scheduling technician.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'In Progress',
          officer: officer._id,
          notes: 'Technician on site, changing the high-pressure sodium bulb.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // Complaint 3: Resolved Garbage Complaint
    const complaint3 = await Complaint.create({
      title: 'Overflowing Trash Bin near Subway Station',
      description: 'The green garbage container near the subway exit is completely full and garbage is scattered on the sidewalk. It is producing a bad smell.',
      citizen: citizen._id,
      category: catGarbage._id,
      status: 'Resolved',
      location: {
        type: 'Point',
        coordinates: [-74.0060, 40.7128] // City Hall coords
      },
      address: 'City Hall Park, New York, NY 10007',
      severity: 'Medium',
      images: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'],
      upvotes: [citizen._id, admin._id],
      assignedOfficer: officer._id,
      timeline: [
        {
          status: 'Reported',
          notes: 'Citizen submitted report.',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'Verified',
          officer: admin._id,
          notes: 'Issue verified. Dispatched sanitation alerts.',
          timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'Assigned',
          officer: admin._id,
          notes: 'Assigned to Sanitation Officer John Doe.',
          timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'Accepted',
          officer: officer._id,
          notes: 'Sanitation crew scheduled for clean-up.',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'In Progress',
          officer: officer._id,
          notes: 'Sanitation truck clearing the bin and cleaning the peripheral sidewalk.',
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        },
        {
          status: 'Resolved',
          officer: officer._id,
          notes: 'Waste collected, bin cleaned and sanitized. Area restored.',
          images: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800'],
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    console.log('3 complaints seeded with detailed histories.');

    // 5. Seed Comments
    console.log('Seeding comments...');
    await Comment.create({
      complaint: complaint2._id,
      user: admin._id,
      text: 'Please make sure this is completed before the weekend. We expect heavy traffic in Central Park.'
    });

    await Comment.create({
      complaint: complaint2._id,
      user: officer._id,
      text: 'Copy that. Team is replacing the bulb today.'
    });

    await Comment.create({
      complaint: complaint3._id,
      user: citizen._id,
      text: 'Thank you for the quick clean-up! The sidewalk looks spotless now.'
    });
    console.log('Comments seeded.');

    // 6. Seed Notifications
    console.log('Seeding notifications...');
    await Notification.create({
      recipient: citizen._id,
      title: 'Complaint Resolved',
      message: 'Great news! Your complaint "Overflowing Trash Bin near Subway Station" has been marked as Resolved.',
      type: 'Status Updated',
      relatedComplaint: complaint3._id,
      isRead: false
    });

    await Notification.create({
      recipient: officer._id,
      title: 'New Assignment',
      message: 'You have been assigned to resolve: "Broken Street Light near Central Park"',
      type: 'New Assignment',
      relatedComplaint: complaint2._id,
      isRead: false
    });
    console.log('Notifications seeded.');

    console.log('Database seeding completed successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
