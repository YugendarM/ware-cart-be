const express = require('express');
const router = express.Router();
const { trackUserActivity, getAnalytics, getAverageProductViews, getBestSellingProducts, getMostLikedProduct, getUserAndProductCount, getCategoryPurchaseCounts, getMonthlyProductActivity, getTopPerformingProducts, getTopRegionsByProductPopularity } = require('../controllers/userActivityController');
const { authenticateOptional } = require('../middlewares/authenticateOptional');
const { adminAuth } = require("../middlewares/adminAuth")

router.post('/track', authenticateOptional ,  trackUserActivity)
router.get('/analytics', adminAuth, getAnalytics);

router.get('/analytics/average-views', adminAuth, getAverageProductViews);
router.get('/analytics/best-selling-product', adminAuth, getBestSellingProducts);
router.get('/analytics/most-liked-product', adminAuth, getMostLikedProduct);
router.get('/analytics/counts', adminAuth, getUserAndProductCount);
router.get('/analytics/category-counts', adminAuth, getCategoryPurchaseCounts);
router.get('/analytics/monthly-product-activity', adminAuth, getMonthlyProductActivity);
router.get('/analytics/top-performing-products', getTopPerformingProducts);
router.get('/analytics/top-regions', adminAuth, getTopRegionsByProductPopularity);

  

module.exports = router;
