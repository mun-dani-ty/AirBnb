// backend/routes/api/index.js
const router = require('express').Router();
const sessionRouter = require('./session.js');

const usersRouter = require('./users.js');
const spotsRouter = require('./spots.js')
const reviewsRouter = require('./reviews.js')
const bookingsRouter = require('./bookings.js')
const spotImagesRouter = require('./spot-images')
const reviewImagesRouter = require('./review-images')
const { restoreUser } = require('../../utils/auth')

// GET /api/restore-user
router.use(restoreUser);

router.use('/spots', spotsRouter)

router.use('/reviews', reviewsRouter)

router.use('/session', sessionRouter);

router.use('/users', usersRouter);

router.use('/bookings', bookingsRouter)

router.use('/spot-images', spotImagesRouter)

router.use('/review-images', reviewImagesRouter)

module.exports = router;
