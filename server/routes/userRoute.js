const router = require('express').Router()
const bcrypt = require('bcrypt')
const userModel = require('../models/userModel');
const { json } = require('express');
const jwt = require('jsonwebtoken')

router.post("/register", (req, res) => {
    const { name, email, password } = req.body;
    console.log(name)
    bcrypt.hash(password, 10).then(async (hash) => {
        try {
            const newUser = new userModel({ name: name, password: hash, email: email })
            await newUser.save()
            res.json({ status: "User created", user: { name: name, email: email } })
        } catch (err) {
            console.log(err)

            res.json("Something went wrong")
        }
    })
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email: email })
    if (!user) {
        res.json("User not found")
    } else {
        bcrypt.compare(password, user.password).then((match) => {
            if (!match) {
                res, json("Wrong password")
            } else {
                const token = jwt.sign({ email: user.email, name: user.name, id: user.id }, "key")
                res.json({ 
                    status: "Logged in",
                    token: token,
                    name: user.name,
                    followersIds: user.followers,
                    followerCount: user.followers.length,
                    followingId: user.following,
                    followingCount:user.following.length 
                })
            }
        })
    }
})

// link to follow 
router.post('/follow', async (req, res) => {
    const { userEmail, followEmail } = req.body // this will take two emails, one for the user who wants to follow(userEmail) and one for the user who wants to follow(followEmail)
    const user1 = await userModel.findOne({ email: userEmail })
    const user2 = await userModel.findOne({ email: followEmail }) //user1 will follow user2
    console.log(user1.name)
    if (!(user1 || user2)) {
        res.json({ error: "Make sure the users exist" })
    } else {
        user1.following.push(user2.id);
        await user1.save()
        user2.followers.push(user1);
        await user2.save()
        res.json({msg: `${user1.name} started following ${user2.name}`})
    }




})

module.exports = router