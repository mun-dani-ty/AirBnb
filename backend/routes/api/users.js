//this file will hold the resources for the route paths beginning with /api/users
const express = require('express')
const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');
//following two lines are from phase 5
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const router = express.Router();


//validateSignup middleware
const validateSignup = [
    check('email')
        .exists({ checkFalsy: true })
        .isEmail()
        .withMessage('Invalid email'),
    check('username')
        .exists({ checkFalsy: true })
        .isLength({ min: 4 })
        .withMessage('Username is required (must be at least 4 characters)'),
    check('password')
        .exists({ checkFalsy: true })
        .isLength({ min: 6 })
        .withMessage('Password must be 6 characters or more.'),
    check('firstName')
        .exists({ checkFalsy: true })
        .isLength({ min: 1 })
        .isString()
        .withMessage('First Name is required'),
    check('lastName')
        .exists({ checkFalsy: true })
        .isLength({ min: 1 })
        .isString()
        .withMessage('Last Name is required'),
    handleValidationErrors
];

router.post('/', validateSignup, async (req, res) => {
    const { email, password, username, firstName, lastName } = req.body;

    try {
        //if all is successful, perform and return the following
        const user = await User.signup({ email, username, password, firstName, lastName });
        const token = await setTokenCookie(res, user);

        return res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            token
        });
    } catch (error) {
        //iterate over 'errors' array and check if error was due to an existing username or email
        //if error was due to existing username or email, send appropriate error message and status code
        if (error.errors && error.errors.length > 0) {
            const errorObj = {};
            error.errors.forEach((ele) => {
                if (ele.path === "username") {
                    errorObj.username = `User with that username already exists`;
                } else if (ele.path === "email") {
                    errorObj.email = `User with that email already exists`;
                }
            })
            return res.status(403).json({
                message: "User already exists",
                statusCode: 403,
                errors: errorObj
            })
        }
        return res.status(500).json({
            message: "Internal server error",
            statusCode: 500
        })
    }
})

module.exports = router;
