const express = require('express');
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

// Sign up
router.post(
    '/',
    async (req, res) => {
        const { email, password, username } = req.body;
        const user = await User.signup({ email, username, password });

        await setTokenCookie(res, user);

        return res.json({
            user: user
        });
    }
);

// Restore session user
router.get(
    '/',
    (req, res) => {
        const { user } = req;
        if (user) {
            return res.json({
                user: user.toSafeObject()
            });
        } else return res.json({ user: null });
    }
);


module.exports = router;
