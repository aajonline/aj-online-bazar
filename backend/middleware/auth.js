const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'অ্যাক্সেস টোকেন নেই, অনুমতি প্রত্যাখ্যাত' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'টোকেন বৈধ নয়, ইউজার পাওয়া যায়নি' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে' 
      });
    }

    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'টোকেন বৈধ নয়' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'টোকেনের মেয়াদ শেষ হয়েছে' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'সার্ভার এরর' 
    });
  }
};

const isShopkeeper = (req, res, next) => {
  if (req.user.userType !== 'shopkeeper') {
    return res.status(403).json({
      success: false,
      message: 'শুধুমাত্র দোকানদারদের অনুমতি আছে'
    });
  }
  next();
};

const isCustomer = (req, res, next) => {
  if (req.user.userType !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'শুধুমাত্র ক্রেতাদের অনুমতি আছে'
    });
  }
  next();
};

module.exports = { auth, isShopkeeper, isCustomer };
