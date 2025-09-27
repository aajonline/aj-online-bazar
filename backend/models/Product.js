const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'পণ্যের নাম আবশ্যক'],
    trim: true,
    maxlength: [100, 'পণ্যের নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে']
  },
  price: {
    type: Number,
    required: [true, 'দাম আবশ্যক'],
    min: [0, 'দাম ০ এর কম হতে পারে না'],
    max: [100000, 'দাম ১,০০,০০০ টাকার বেশি হতে পারে না']
  },
  unit: {
    type: String,
    required: [true, 'একক আবশ্যক'],
    enum: {
      values: ['কেজি', 'গ্রাম', 'পিস', 'হালি', 'লিটার', 'প্যাকেট', 'বোতল', 'ডজন'],
      message: 'সঠিক একক নির্বাচন করুন'
    }
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'দোকান ID আবশ্যক']
  },
  category: {
    type: String,
    enum: ['চাল-ডাল', 'তেল-মসলা', 'সবজি', 'ফল', 'মাছ-মাংস', 'দুধ-ডিম', 'অন্যান্য'],
    default: 'অন্যান্য'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'স্টক ০ এর কম হতে পারে না']
  },
  description: {
    type: String,
    maxlength: [500, 'বিবরণ সর্বোচ্চ ৫০০ অক্ষরের হতে পারে']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ shopId: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `${this.price} টাকা/${this.unit}`;
});

// Static method to find products by shop
productSchema.statics.findByShop = function(shopId, isAvailable = true) {
  return this.find({ shopId, isAvailable }).sort({ createdAt: -1 });
};

// Static method to search products
productSchema.statics.searchProducts = function(query, shopId) {
  const searchQuery = {
    shopId,
    isAvailable: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  };
  return this.find(searchQuery).sort({ createdAt: -1 });
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity) {
  this.stock = Math.max(0, this.stock - quantity);
  if (this.stock === 0) {
    this.isAvailable = false;
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);