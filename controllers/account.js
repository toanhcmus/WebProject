const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require('../models/User.js');

module.exports = {
    register: async (req, res, next) => {
        const body = req.body;
        let error = null;
    
        if (body.reqemail == '') {
            error = "Email cannot be empty!";
        }
        if (body.reqpassword != body.reqcpassword) {
            error = "Password and Confirmed Password should be the same!";
        }
        if (body.reqcpassword == '') {
            error = "Confirmed Password cannot be empty!";
        }
        if (body.reqpassword == '') {
            error = "Password cannot be empty!";
        }
        if (body.requsername == '') {
            error = "Username cannot be empty!";
        }
    
        if (error) {
            res.render('login', {
                layout: '',
                error: error,
                username: body.requsername,
                password: body.reqpassword,
                cpassword: body.reqcpassword,
                email: body.reqemail
            });
        }
        else {
            if (await User.checkUsernameExist(body.requsername)) {
                res.render('login', {
                    layout: '',
                    error: 'That username is already existed!',
                    username: body.requsername,
                    password: body.reqpassword,
                    cpassword: body.reqcpassword,
                    email: body.reqemail
                });
            }
            else {
                const pwHashed = await bcrypt.hash(body.reqpassword, saltRounds);
                const newUser = new User({ username: body.requsername, password: pwHashed, email: body.reqemail, isAdmin: false });
                await User.insertUser(newUser);
                res.render('login', {
                    layout: '',
                    success: 'Account created successfully!',
                    username: body.requsername,
                    password: body.reqpassword,
                    cpassword: body.reqcpassword,
                    email: body.reqemail
                });
            }
        }
    },
    logout: async (req, res, next) => {
        console.log('req user');
        console.log(req.user);
        req.logOut(err => {
            console.log(err);
        })
        res.redirect('/');
    },
}