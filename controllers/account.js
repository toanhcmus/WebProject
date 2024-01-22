const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require('../models/User.js');

module.exports = {
    register: async (req, res, next) => {
        const body = req.body;
        let error = null;

        if (body.reqemail == '') {
            error = "Email không thể để trống!";
        }
        if (body.reqpassword != body.reqcpassword) {
            error = "Mật khẩu mới và nhập lại mật khẩu mới không trùng nhau!";
        }
        if (body.reqcpassword == '') {
            error = "Vui lòng nhập lại mật khẩu!";
        }
        if (body.reqpassword == '') {
            error = "Mật khẩu không thể để trống!";
        }
        if (body.requsername == '') {
            error = "Username không thể để trống!";
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
                    error: 'Username đã tồn tại!',
                    username: body.requsername,
                    password: body.reqpassword,
                    cpassword: body.reqcpassword,
                    email: body.reqemail
                });
            }
            else if (await User.checkEmailExist(body.reqemail)) {
                res.render('login', {
                    layout: '',
                    error: 'Email này đã được sử dụng!',
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
                    success: 'Tạo tài khoản thành công!',
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
    renderAuthFail: async (req, res, next) => {
        res.render('login', {
            layout: '',
            error: "Username hoặc mật khẩu không đúng!"
        });
    },
    changePassword: async (req, res, next) => {
        if (req.isAuthenticated() || req.user || req.session.user) {
            const body = req.query;
            console.log(body.cpOldPassword);
            console.log(body.cpNewPassword);
            console.log(body.cpConfirmNewPassword);
            console.log(body.cpUsername);

            let error = null;

            if (body.cpOldPassword == '' || body.cpNewPassword == '' || body.cpConfirmNewPassword == '') {
                error = "Lỗi xảy ra! (Vui lòng điền đầy đủ thông tin)";
            }
            else if (body.cpNewPassword != body.cpConfirmNewPassword) {
                error = "Lỗi xảy ra! (Mật khẩu mới và nhập lại mật khẩu mới không trùng nhau)";
            }

            if (error) {
                res.render('profile', {
                    layout: 'main',
                    account: req.user,
                    error: error
                });
            }
            else {
                const rs = await User.getUser(body.cpUsername);
                if (rs) {
                    auth = await bcrypt.compare(body.cpOldPassword, rs.password);
                    if (auth) {
                        const pwHashed = await bcrypt.hash(body.cpNewPassword, saltRounds);
                        await User.editUser(body.cpUsername, req.user.email, pwHashed);
                        res.render('profile', {
                            layout: 'main',
                            account: req.user,
                            success: "Đổi mật khẩu thành công!"
                        });
                    }
                    else {
                        res.render('profile', {
                            layout: 'main',
                            account: req.user,
                            error: "Lỗi xảy ra! (Sai mật khẩu)"
                        });
                    }
                }
                else {
                    res.render('profile', {
                        layout: 'main',
                        account: req.user,
                        error: "Lỗi xảy ra!"
                    });
                }
            }
        }
        else {
            res.redirect('/');
        }
    },
}