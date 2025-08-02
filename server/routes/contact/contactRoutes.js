const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/contact/contactController');

// Contact form submission route
router.post('/contact', contactController.sendContactEmail);

module.exports = router;