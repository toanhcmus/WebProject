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

            const rs = await User.getUser(body.cpUsername);

            if (error) {
                res.render('profile', {
                    layout: 'main',
                    account: rs,
                    error: error
                });
            }
            else {
                if (rs) {
                    auth = await bcrypt.compare(body.cpOldPassword, rs.password);
                    if (auth) {
                        const pwHashed = await bcrypt.hash(body.cpNewPassword, saltRounds);
                        await User.editUser(body.cpUsername, rs.email, pwHashed);
                        rs = await User.getUser(body.cpUsername);
                        res.render('profile', {
                            layout: 'main',
                            account: rs,
                            success: "Đổi mật khẩu thành công!"
                        });
                    }
                    else {
                        res.render('profile', {
                            layout: 'main',
                            account: rs,
                            error: "Lỗi xảy ra! (Sai mật khẩu)"
                        });
                    }
                }
                else {
                    res.render('profile', {
                        layout: 'main',
                        account: rs,
                        error: "Lỗi xảy ra!"
                    });
                }
            }
        }
        else {
            res.redirect('/login');
        }
    },
    renderAccountManager: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false) {
            return res.redirect('/');
        }
        let accountList = await User.getAllUsers();
        console.log(accountList);
        res.render('account_manager', {
            layout: 'main',
            accountList: accountList
        });
    },
    managerRemoveUser: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false) {
            return res.redirect('/');
        }
        let toBeDeletedUser = await User.getUser(req.params.Username);
        if (toBeDeletedUser.isAdmin) {
            let accountList = await User.getAllUsers();
            return res.render('account_manager', {
                layout: 'main',
                accountList: accountList,
                error: 'Không thể xóa tài khoản admin!'
            });
        }
        await User.removeUser(req.params.Username);
        let accountList = await User.getAllUsers();
        res.render('account_manager', {
            layout: 'main',
            accountList: accountList,
            success: 'Xóa tài khoản thành công!'
        });
    },
    managerEditUser: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false) {
            return res.redirect('/');
        }
        if (await User.checkEmailExist(req.query.MEmail)) {
            let accountList = await User.getAllUsers();
            return res.render('account_manager', {
                layout: 'main',
                accountList: accountList,
                error: 'Email này đã được sử dụng!'
            });
        }

        let currentUser = await User.getUser(req.query.MUsername);

        let newEmail = req.query.MEmail.trim();
        let oldEmail = currentUser.email;
        if (newEmail == '' || newEmail == oldEmail) {
            newEmail = oldEmail;
        }

        let newPassword = req.query.MPassword.trim();
        let oldPassword = currentUser.password;
        let same = await bcrypt.compare(newPassword, oldPassword);
        if (newPassword == '' || same) {
            newPassword = oldPassword;
        }
        else newPassword = await bcrypt.hash(newPassword, saltRounds)

        await User.editUser(req.query.MUsername, newEmail, newPassword);
        let accountList = await User.getAllUsers();
        res.render('account_manager', {
            layout: 'main',
            accountList: accountList,
            success: 'Thay đổi thông tin thành công!'
        });
    },
    managerAddUser: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false) {
            return res.redirect('/');
        }
        const body = req.query;
        let error = null;

        if (body.MAEmail == '') {
            error = "Email không thể để trống!";
        }
        if (body.MAPassword == '') {
            error = "Mật khẩu không thể để trống!";
        }
        if (body.MAUsername == '') {
            error = "Username không thể để trống!";
        }

        let accountList = await User.getAllUsers();

        if (error) {
            res.render('account_manager', {
                layout: 'main',
                accountList: accountList,
                error: error
            });
        }
        else {
            if (await User.checkUsernameExist(body.MAUsername)) {
                res.render('account_manager', {
                    layout: 'main',
                    accountList: accountList,
                    error: 'Username đã tồn tại!'
                });
            }
            else if (await User.checkEmailExist(body.MAEmail)) {
                res.render('account_manager', {
                    layout: 'main',
                    accountList: accountList,
                    error: 'Email này đã được sử dụng!'
                });
            }
            else {
                const pwHashed = await bcrypt.hash(body.MAPassword, saltRounds);
                const newUser = new User({ username: body.MAUsername, password: pwHashed, email: body.MAEmail, isAdmin: false });
                await User.insertUser(newUser);
                accountList = await User.getAllUsers();
                res.render('account_manager', {
                    layout: 'main',
                    accountList: accountList,
                    success: 'Thêm tài khoản thành công!'
                });
            }
        }
    },
}