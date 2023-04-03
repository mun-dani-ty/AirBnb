//this file will hold the resources for the route paths beginning with /api/spots
const express = require('express')
const { setTokenCookie, requireAuth, restoreUser } = require('../../utils/auth');
const { Spot, User, SpotImage, Review, Booking, ReviewImage, sequelize } = require('../../db/models');


//following two lines are from phase 5
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const router = express.Router();

//in case we need these models
const { Model, Sequelize, Op, DataTypes } = require('sequelize');
const booking = require('../../db/models/booking');
// const spot = require('../../db/models/spot');

//spot validations
const validateSpot = [
    check('address').exists({ checkFalsy: true }).withMessage('Street address is required'),
    check('city').exists({ checkFalsy: true }).withMessage('City is required'),
    check('state').exists({ checkFalsy: true }).withMessage('State is required'),
    check('country').exists({ checkFalsy: true }).withMessage('Country is required'),
    check('lat').exists({ checkFalsy: true }).toFloat().isDecimal().withMessage('Latitude is not valid'),
    check('lng').exists({ checkFalsy: true }).toFloat().isDecimal().withMessage('Longitude is not valid'),
    check('name').exists({ checkFalsy: true }).isLength({ min: 1, max: 49 }).withMessage('Name must be less than 50 characters'),
    check('description').exists({ checkFalsy: true }).withMessage('Description is required'),
    check('price').exists({ checkFalsy: true }).withMessage('Price per day is required'),
    handleValidationErrors
]

//review validations
const validateReview = [
    check('review').exists({ checkFalsy: true }).withMessage('Review text is required'),
    check('stars').exists({ checkFalsy: true }).isInt({ min: 1, max: 5 }).withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
]

//bookings validations
const validateBookings = [
    check('startDate').exists({ checkFalsy: true }),
    check('endDate').exists({ checkFalsy: true })
        .custom((value, { req }) => {
            if (value <= req.body.startDate) {
                throw new Error('endDate cannot be on or before startDate');
            }
            return true
        }),
    handleValidationErrors
]

//query filter validations
const validateQueryParamaters = [
    check("page")
        .default(1)
        .notEmpty()
        .withMessage("Page must be provided")
        .isFloat({ min: 1, max: 10 })
        .withMessage("Page must be greater than or equal to 1 and less than or equal to 10"),
    check("size")
        .default(20)
        .notEmpty()
        .withMessage("Size must be provided")
        .isFloat({ min: 1, max: 20 })
        .withMessage("Size must be greater than or equal to 1 and less than or equal to 20"),
    check("minLat")
        .optional()
        .isFloat()
        .withMessage("Minimum latitude is invalid"),
    check("maxLat")
        .optional()
        .isFloat()
        .withMessage("Maximum latitude is invalid"),
    check("minLng")
        .optional()
        .isFloat()
        .withMessage("Minimum longitude is invalid"),
    check("maxLng")
        .optional()
        .isFloat()
        .withMessage("Maximum longitude is invalid"),
    check("minPrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Maximum price must be greater than or equal to 0"),
    check("maxPrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Minimum price must be greater than or equal to 0"),
    handleValidationErrors
];


//Get all spots after filters have been applied
router.get("/", validateQueryParamaters, async (req, res, next) => {
    //extract the values from the query parameters and specify default values for page and size
    const {
        page = 1,
        size = 20,
        minLat,
        maxLat,
        minLng,
        maxLng,
        minPrice,
        maxPrice,
    } = req.query;

    //set limit and offset variables used in the query to retrieve the result
    //IMPORTANT NOTES FROM PAGINATION READING
    //LIMIT = (x results/page)
    //OFFSET = (y pages) * (x results/page)
    const limit = size;
    const offset = (page - 1) * size;

    //define empty object that will hold the conditions used to filter the query result
    const filter = {};

    //filter spots that have a latitude greater than or equal to the value of minLat
    if (minLat) filter.lat = { [Sequelize.Op.gte]: minLat };

    //filter spots that have a latitude less than or equal to the max latitude
    if (maxLat) filter.lat = { ...filter.lat, [Sequelize.Op.lte]: maxLat };

    //if both min and max have been given, filter spots with latitudes in between the two values
    if (minLat && maxLat) {
        filter.lat = {
            ...filter.lat,
            [Sequelize.Op.and]: [
                { [Sequelize.Op.gte]: minLat },
                { [Sequelize.Op.lte]: maxLat }
            ]
        }
    }
    //filter spots that have a longitude greater than or equal to the min longitude
    if (minLng) filter.lng = { [Sequelize.Op.gte]: minLng };

    //filter spots that have a longitude less than or equal to the max longitude
    if (maxLng) filter.lng = { ...filter.lng, [Sequelize.Op.lte]: maxLng };

    //if both min and max lng have been given, filter spots with longitudes in between the two values
    if (minLng && maxLng) {
        filter.lng = {
            ...filter.lng,
            [Sequelize.Op.and]: [
                { [Sequelize.Op.gte]: minLng },
                { [Sequelize.Op.lte]: minLng }
            ]
        }
    }

    //filter spots that have a price greater than or equal to the min price
    if (minPrice) filter.price = { [Sequelize.Op.gte]: minPrice };

    //filter spots that have a price less than or equal to the max price
    if (maxPrice) filter.price = { ...filter.price, [Sequelize.Op.lte]: maxPrice };

    //if both min and max prices have been given, filter spots with prices in between the two values
    if (minPrice && maxPrice) {
        filter.price = {
            ...filter.price,
            [Sequelize.Op.and]: [
                { [Sequelize.Op.gte]: minPrice },
                { [Sequelize.Op.lte]: maxPrice }
            ]
        }
    }

    //find all locations that match the criteria
    const locations = await Spot.findAll({
        include: [
            {
                model: SpotImage,
                attributes: ["url"]
            },
            //as well as the star rating of any reviews associated with the spot
            {
                model: Review,
                attributes: ["stars"],
                required: false
            }
        ],
        //limit the number of spots returned and set the starting position for the results
        limit,
        offset,
        where: filter,
    });

    //create new array on locations that were retrieved from the database
    const allLocations = locations.map((loc) => {
        const reviews = loc.Reviews || [];

        //take the 'Reviews' property from the loc (short for locations) object (which contains an array of reviews for the spot) and reduce it to a single number
        const sumRatings = reviews.reduce((acc, cur) => acc + cur.stars, 0);

        //if there are reviews, divide the sum by the number of reviews to get the average rating for the spot
        //if there are no reviews for the spot, the avgRating will be set to null
        let avgRating;

        if (reviews.length > 0) {
            avgRating = sumRatings / reviews.length
        } else {
            avgRating = null;
        }

        //NEW ADDITIONS
        loc = loc.toJSON();
        const lat = parseFloat(loc.lat);
        const lng = parseFloat(loc.lng);
        const price = parseFloat(loc.price);

        return {
            id: loc.id,
            ownerId: loc.ownerId,
            address: loc.address,
            city: loc.city,
            state: loc.state,
            country: loc.country,
            lat,
            lng,
            name: loc.name,
            description: loc.description,
            price,
            createdAt: loc.createdAt,
            updatedAt: loc.updatedAt,
            avgRating,
            //previewImage property will be set to the url of the first image for the spot, which is retrieved from the SpotImages property of the spot object
            //if there are no images for the spot, set previewImage to null
            previewImage: loc.SpotImages[0]?.url || null,
        };
    });

    //if locations have been found, return 200 with Spots array + page + size
    if (allLocations.length > 0) return res.status(200).json({
        Spots: allLocations,
        page: parseInt(page),
        size: parseInt(size)
    })

    //if no locations were found, return 404 with message saying none were found
    return res.status(404).json({
        message: "Spots couldn't be found"
    })
});
