    } else if (req.user.userType === 'shopkeeper') {
      query.shopId = req.user._id;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি বা বাতিল করা যাবে না'
      });
    }

    await order.updateStatus('cancelled', 'ইউজার কর্তৃক বাতিল');

    res.json({
      success: true,
      message: 'অর্ডার বাতিল করা হয়েছে'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'সার্ভার এরর'
    });
  }
});

module.exports = router;