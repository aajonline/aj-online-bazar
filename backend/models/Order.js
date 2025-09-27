const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ক্রেতার ID আবশ্যক']
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'দোকানের ID আবশ্যক']
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  shopPhone: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: [true, 'মোট দাম আবশ্যক'],
    min: [0, 'মোট দাম ০ এর কম হতে পারে না']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      message: 'সঠিক স্ট্যাটাস নির্বাচন করুন'
    },
    default: 'pending'
  },
  customerAddress: {
    type: String,
    required: [true, 'ক্রেতার ঠিকানা আবশ্যক']
  },
  deliveryAddress: {
    type: String
  },
  notes: {
    type: String,
    maxlength: [500, 'নোট সর্বোচ্চ ৫০০ অক্ষরের হতে পারে']
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bkash', 'nagad', 'rocket'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Generate unique order ID before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderId = `AJ${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Indexes for better query performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, status: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Virtual for Bengali status
orderSchema.virtual('bengaliStatus').get(function() {
  const statusMap = {
    'pending': 'অপেক্ষমান',
    'confirmed': 'নিশ্চিত',
    'preparing': 'প্রস্তুত হচ্ছে',
    'ready': 'প্রস্তুত',
    'delivered': 'ডেলিভার',
    'cancelled': 'বাতিল'
  };
  return statusMap[this.status] || this.status;
});

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function(customerId, status = null) {
  const query = { customerId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find orders by shop
orderSchema.statics.findByShop = function(shopId, status = null) {
  const query = { shopId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) this.notes = notes;
  
  if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
    this.paymentStatus = 'paid';
  }
  
  return this.save();
};

// Static method for sales report
orderSchema.statics.getSalesReport = function(shopId, startDate, endDate) {
  const matchQuery = {
    shopId: mongoose.Types.ObjectId(shopId),
    status: 'delivered'
  };
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);