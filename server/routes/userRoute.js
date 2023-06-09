const router = require('express').Router()
const bcrypt = require('bcrypt')
const userModel = require('../models/userModel');
const { json } = require('express');
const jwt = require('jsonwebtoken')
const { validateToken } = require('../middleware/validateToken')

router.post("/register", (req, res) => {
    const { name, email, password } = req.body;
    console.log(name)
    bcrypt.hash(password, 10).then(async (hash) => {
        try {
            const newUser = new userModel({name: name, password: hash})
            await newUser.save()
            res.json({ status: "User created", user: { name: name, email: email } })
        } catch (err) {
            console.log(err)

            res.json("Something went wrong")
        }
    })
})

router.post('/login', async (req, res) => {
    const { name, password } = req.body;
    const user = await userModel.findOne({ name: name })
    if (!user) {
        res.json("User not found")
    } else {
        bcrypt.compare(password, user.password).then((match) => {
            if (!match) {
                res, json("Wrong password")
            } else {
                const token = jwt.sign({ name: user.name, id: user.id, user: user, following: user.following }, "key")
                res.json({
                    status: "Logged in",
                    token: token,
                    name: user.name,
                    followersIds: user.followers,
                    followerCount: user.followers.length,
                    followingId: user.following,
                    followingCount: user.following.length
                })
            }
        })
    }
})

// to get all the users user is following
router.post('/getfollowing', validateToken, async (req, res) => {
    try {
        const result = await userModel.find({})
        console.log("getting in")
        console.log(res.header("accessToken"))
        const followersId = req.user.user.following
        const users = []
        let i = 0
        await Promise.all(
            followersId.map(async (element) => {
                const newUser = await userModel.findById(element);
                users.push(newUser);
            })
        );

        console.log(users)
        res.json(users)
        //res.status(200).json(req.user.following);
    } catch (err) {
        res.status(400).json("something went wrong")
    }
})
//get all users
router.post('/getusers', async (req, res) => {
    try {
        const result = await userModel.find({})
        res.json(result)

    } catch (err) {
        res.status(400).json("something went wrong")
    }
})

// get user data for user profile
router.get('/getprofile', validateToken, async (req, res) => {
    const id = req.user.id
    const user = await userModel.findById(id)
    res.json({user: user, name: user.name})
})

// link to follow 
router.post('/follow', validateToken, async (req, res) => {
    const { name2 } = req.body
    const name1 = req.user.name // this will take two emails, one for the user who wants to follow(userEmail) and one for the user who wants to follow(followEmail)
    try {
        const user1 = await userModel.findOne({ name: name1 })
        const user2 = await userModel.findOne({ name: name2 }) //user1 will follow user2
        console.log(user1.name)
        if (!(user1 || user2)) {
            res.json("Make sure the users exist")
        } else {
            if (!user2.followers.includes(user1.id)) {
                await user2.updateOne({ $push: { followers: user1.id } });
                await user1.updateOne({ $push: { following: user2.id } });
                res.status(200).json(`${user1.name} started following ${user2.name}`);
            } else {
                res.status(403).json("you already follow this user");
            }


        }
    } catch (err) {
        res.json(err)
    }

})

//follow checker, to see if a user already follows someone
router.post('/followcheck', validateToken, async (req, res) => {
    const { name2, } = req.body
    const name1 = req.user.name
    try {
        const user1 = await userModel.findOne({ name: name1 })
        const user2 = await userModel.findOne({ name: name2 }) //user1 will follow user2
        console.log(user1.name)


        if (!user2.followers.includes(user1.id)) {
            res.json(true)
            res.status(200).json(`${user1.name} started following ${user2.name}`);
        } else {
            res.status(403).json(false);
        }



    } catch (err) {
        res.json(err)
    }
})


router.post("/unfollow", async (req, res) => {
    const { name1, name2 } = req.body
    try {
        console.log("got in")
        const user1 = await userModel.findOne({ name: name1 })
        const user2 = await userModel.findOne({ name: name2 }) //user1 will unfollow user2
        if (user2.followers.includes(user1.id)) {
            await user2.updateOne({ $pull: { followers: user1.id } });
            await user1.updateOne({ $pull: { followings: user1.id } });
            res.status(200).json(`${user1.name} has unfollowed ${user2.name}`);
        } else {
            res.status(403).json("you dont follow this user");
        }
    } catch (err) {
        res.status(500).json(err);
    }

});

module.exports = router