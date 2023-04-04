const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { ValidationError } = require('sequelize');
//var bcrypt = require('bcryptjs');
//Create a variable called isProduction that will be true if the environment is in production or not by checking the environment key in the configuration file (backend/config/index.js):
const { environment } = require('./config');
const isProduction = environment === 'production';

//routes
const routes = require('./routes');

//Initialize the Express application:
const app = express();

//Connect the morgan middleware for logging information about requests and responses:
app.use(morgan('dev'));

//Add the cookie-parser middleware for parsing cookies and the express.json middleware for parsing JSON bodies of requests with Content-Type of "application/json"
app.use(cookieParser());
app.use(express.json());


// Security Middleware
if (!isProduction) {
    // enable cors only in development
    app.use(cors());
}

// helmet helps set a variety of headers to better secure your app
app.use(
    helmet.crossOriginResourcePolicy({
        policy: "cross-origin"
    })
);

// Set the _csrf token and create req.csrfToken method
app.use(
    csurf({
        cookie: {
            secure: isProduction,
            sameSite: isProduction && "Lax",
            httpOnly: true
        }
    })
);

//Routes
app.use(routes); // Connect all the routes


// Catch unhandled requests and forward to error handler.
app.use((_req, _res, next) => {
    const err = new Error("The requested resource couldn't be found.");
    err.title = "Resource Not Found";
    err.errors = ["The requested resource couldn't be found."];
    err.status = 404;
    next(err);
});

//If this resource-not-found middleware is called, an error will be created with the message "The requested resource couldn't be found." and a status code of 404. Afterwards, next will be invoked with the error. Remember, next invoked with nothing means that error handlers defined after this middleware will not be invoked. However, next invoked with an error means that error handlers defined after this middleware will be invoked.

// Process sequelize errors
//catches sequelize  database validation errors
app.use((err, req, res, next) => {
    (console.log("IN APP.JS PROCESS SEQUELIZE ERRORS MIDDLEARE"))
    // check if error is a Sequelize error:
    if (err instanceof ValidationError) {

        let errObj = {};
        err.errors.forEach(e => {
            let newKey = e.path;
            let newVal = e.message;
            errObj[newKey] = newVal;
        })

        err.message = 'Validation Error';
        err.errors = errObj;
        err.status = 400;

        return res.json({
            // title: err.title || 'Server Error',
            message: err.message,
            errors: err.errors,
            statusCode: err.status
            // stack: isProduction ? null : err.stack
        })

        // for (let error of err.errors) {
        //   errors[error.path] = error.message;
        // }
        // err.title = 'Validation error';
        // err.errors = errors;
    }
    next(err);
});

//If the error that caused this error-handler to be called is an instance of ValidationError from the sequelize package, then the error was created from a Sequelize database validation error and the additional keys of title string and errors array will be added to the error and passed into the next error handling middleware.

// Error formatter
app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    console.error(err);
    res.json({
        //title: err.title || 'Server Error',
        message: err.message,
        errors: err.errors,
        statusCode: err.status,
        //stack: isProduction ? null : err.stack
    });
});

//Export the app
module.exports = app;
