const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'নাম আবশ্যক'],
    trim: true,
    maxlength: [50, 'নাম সর্বোচ্চ ৫০ অক্ষরের হতে পারে']
  },
  phone: {
    type: String,
    required: [true, 'ফোন নাম্বার আবশ্যক'],
    unique: true,
    match: [/^01[3-9]\d{8}$/, 'সঠিক বাংলাদেশী ফোন নাম্বার দিন']
  },
  password: {
    type: String,
    required: [true, 'পাসওয়ার্ড আবশ্যক'],
    minlength: [6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে']
  },
  userType: {
    type: String,
    enum: {
      values: ['shopkeeper', 'customer'],
      message: 'ইউজার টাইপ shopkeeper অথবা customer হতে হবে'
    },
    required: [true, 'ইউজার টাইপ আবশ্যক']
  },
  division: {
    type: String,
    required: [true, 'বিভাগ আবশ্যক']
  },
  district: {
    type: String,
    required: [true, 'জেলা আবশ্যক']
  },
  area: {
    type: String,
    required: [true, 'এলাকা আবশ্যক']
  },
  address: {
    type: String,
    required: [true, 'ঠিকানা আবশ্যক'],
    maxlength: [200, 'ঠিকানা সর্বোচ্চ ২০০ অক্ষরের হতে পারে']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ phone: 1 });
userSchema.index({ userType: 1, division: 1, district: 1, area: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find users by area
userSchema.statics.findByArea = function(division, district, area) {
  return this.find({ division, district, area, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
