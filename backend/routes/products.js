        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'সার্ভার এরর'
    });
  }
});

router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { search, category, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = { 
      shopId, 
      isAvailable: true 
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .populate('shopId', 'name phone address area district');

    res.json({
      success: true,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Get shop products error:', error);
    res.status(500).json({
      success: false,
      message: 'সার্ভার এরর'
    });
  }
});

router.put('/:id', auth, isShopkeeper, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const product = await Product.findOne({ _id: id, shopId: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'পণ্য পাওয়া যায়নি'
      });
    }

    Object.assign(product, {
      ...value,
      name: value.name.trim(),
      description: value.description?.trim()
    });

    await product.save();

    res.json({
      success: true,
      message: 'পণ্য সফলভাবে আপডেট করা হয়েছে',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'সার্ভার এরর'
    });
  }
});

router.delete('/:id', auth, isShopkeeper, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, shopId: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'পণ্য পাওয়া যায়নি'
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'পণ্য সফলভাবে মুছে ফেলা হয়েছে'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'সার্ভার এরর'
    });
  }
});

router.patch('/:id/toggle-availability', auth, isShopkeeper, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, shopId: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'পণ্য পাওয়া যায়নি'
      });
    }

    product.isAvailable = !product.isAvailable;
    await product.save();

    res.json({
      success: true,
      message: `পণ্য ${product.isAvailable ? 'উপলব্ধ' : 'অনুপলব্ধ'} করা হয়েছে`,
      product
    });

  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'সার্ভার এরর'
    });
  }
});

router.get('/categories', (req, res) => {
  const categories = [
    'চাল-ডাল',
    'তেল-মসলা', 
    'সবজি',
    'ফল',
    'মাছ-মাংস',
    'দুধ-ডিম',
    'অন্যান্য'
  ];
  
  res.json({
    success: true,
    categories
  });
});

module.exports = router;