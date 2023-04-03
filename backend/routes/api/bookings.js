//this file will hold the resources for the route paths beginning with /api/bookings
const express = require('express')
const { setTokenCookie, requireAuth, restoreUser } = require('../../utils/auth');
const { Spot, User, SpotImage, Review, ReviewImage, Booking } = require('../../db/models');

//following two lines are from phase 5
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { Sequelize, Op } = require('sequelize');
const { response } = require('express');
const router = express.Router();

const validateBookings = [
    check('startDate').exists({ checkFalsy: true }),
    check('endDate').exists({ checkFalsy: true })
        .custom((value, { req }) => {
            if (value < req.body.startDate) {
                throw new Error('endDate cannot come before startDate');
            }
            return true
        }),
    handleValidationErrors
]
router.get('/current', requireAuth, async (req, res, next) => {
    const currentUser = req.user.id;
    const userBookings = await Booking.findAll({
        where: {
            userId: currentUser,
        },
        include: [
            {
                model: Spot,
                attributes: [
                    'id',
                    'ownerId',
                    'address',
                    'city',
                    'state',
                    'country',
                    'lat',
                    'lng',
                    'name',
                    'price',
                ],
                include: [
                    {
                        model: SpotImage,
                        attributes: ['url'],
                        limit: 1,
                    },
                ],
            },
        ],
        attributes: ['id', 'spotId', 'userId', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
    });

    //TESTING SIMILAR STYLE TO REVIEWS.JS
    if (userBookings) {
        const bookings = userBookings.map((booking) => {

            const { id, spotId, userId, startDate, endDate, createdAt, updatedAt, Spot } = booking.toJSON();

            let previewImage = null;
            if (Spot.SpotImages.length > 0) {
                previewImage = Spot.SpotImages[0].url;
            } else {
                previewImage = null;
            }

            //NEW ADDITIONS:
            const lat = parseFloat(Spot.lat);
            const lng = parseFloat(Spot.lng);
            const price = parseFloat(Spot.price);

            //return the order you want the response body in
            return {
                id, spotId, userId, startDate, endDate, createdAt, updatedAt, Spot: {
                    id: Spot.id,
                    ownerId: Spot.ownerId,
                    address: Spot.address,
                    city: Spot.city,
                    state: Spot.state,
                    country: Spot.country,
                    lat,
                    lng,
                    // lat: Spot.lat,
                    // lng: Spot.lng,
                    name: Spot.name,
                    price,
                    // price: Spot.price,
                    previewImage
                }
            }
        })
        return res.status(200).json({ Bookings: bookings });
    }
    return res.status(404).json({
        message: "Reviews couldn't be found"
    })
});

//Edit a booking
router.put('/:bookingId', requireAuth, validateBookings, async (req, res) => {

    //NEED TO COME BACK HERE AND ADD AUTHORIZATION CHECK

    //extract startDate and endDate from req body
    //NEED TO USE LET HERE SINCE WE WILL REASSIGN LATER
    let { startDate, endDate } = req.body;

    //create new startDate and endDate
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    //extract specific bookingId from params
    const bookingId = req.params.bookingId;

    let oldBooking = await Booking.findByPk(bookingId);

    //if there is no booking at this id, return a 404 with message
    if (!oldBooking) return res.status(404).json({
        message: "Booking couldn't be found",
        statusCode: 404
    })

    //check for authorization
    //booking must belong to current user
    if (oldBooking.userId !== req.user.id) return res.status(403).json({
        message: "Forbidden",
        statusCode: 403
    })

    //see if user is trying to edit a booking that has ended already (before the current date)
    const currDate = new Date()
    const oldEndDate = Date.parse(oldBooking.endDate);

    //if they are, return a 403 with message
    if (oldEndDate < currDate) return res.status(403).json({
        message: "Past bookings can't be modified",
        statusCode: 403
    })

    //if there are conflicting times/dates, return a 403 saying the dates are already taken
    const conflictingDate = await Booking.findOne({
        where: {
            id: bookingId,
            [Op.and]: [
                {
                    //first, check if start and end dates fall between existing booking's start and end date
                    [Op.or]: [
                        { startDate: { [Op.between]: [startDate, endDate] } },
                        { endDate: { [Op.between]: [startDate, endDate] } },
                    ]
                },
                {
                    //then, check if an existing booking's start and end dates fall between the start and end dates provided
                    [Op.or]: [
                        { startDate: { [Op.gte]: startDate } },
                        { endDate: { [Op.lte]: endDate } }
                    ]
                }
            ]
        }
    })

    //if there is a conflictingDate, return necessary errors
    if (conflictingDate) {
        const errors = {};

        //check if start date conflicts with existing booking
        if (new Date(startDate) >= new Date(conflictingDate.startDate) && new Date(startDate) <= new Date(conflictingDate.endDate)) {
            errors.startDate = 'Start date conflicts with an existing booking';
        }

        //check if end date conflicts with existing booking
        if (new Date(endDate) >= new Date(conflictingDate.startDate) && new Date(endDate) <= new Date(conflictingDate.endDate)) {
            errors.endDate = 'End date conflicts with an existing booking';
        }

        return res.status(403).json({
            message: 'Sorry, this spot is already booked for the specified dates',
            statusCode: 403,
            errors: errors
        })
    }
    //update oldBooking and return status 200 with it as json
    oldBooking.update({ startDate, endDate });

    return res.status(200).json(oldBooking);
})


//Delete a booking
router.delete('/:bookingId', requireAuth, async (req, res) => {
    //extract bookingId from params
    const bookingId = req.params.bookingId;

    const booking = await Booking.findOne({
        where: { id: bookingId },
        include: [
            {
                model: Spot,
                attributes: {
                    include: ["ownerId"]
                }
            }
        ]
    })

    //if no booking was found at this id, return 404 with specific message
    if (!booking) return res.status(404).json({
        message: "Booking couldn't be found",
        statusCode: 404
    })

    //check for authorization WIP
    if (req.user.id !== booking.userId && req.user.id !== booking.Spot.ownerId) {
        return res.status(403).json({
            message: 'Forbidden',
            statusCode: 403
        })
    }

    //bookings that have been started cannot be deleted
    //find out when booking's startDate was and if it is before today's date, return 403 with specific message
    const bookingStart = booking.startDate;
    const today = new Date()

    if (new Date(bookingStart) <= today) return res.status(403).json({
        message: "Bookings that have been started can't be deleted",
        statusCode: 403
    })

    //if booking was found at this id, and its startDate has not started yet, destroy it
    await booking.destroy()
    return res.status(200).json({
        message: 'Successfully deleted',
        statusCode: 200
    })
})


module.exports = router;
