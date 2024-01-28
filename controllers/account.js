const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require('../models/User.js');
const Category = require('../models/Category.js');
const Product = require('../models/Product');
const paymentM = require('../models/Payment');
const billM = require('../models/Bill');
const fs = require('fs');
const path = require('path');
const billC = require('./bill.c');
const productM = require('../models/Product');
const jwt = require('jsonwebtoken');

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
    renderAuthFailPayment: async (req, res, next) => {
        res.render('loginPayment', {
            layout: '',
            error: "Username hoặc mật khẩu không đúng!"
        });
    },
    changePassword: async (req, res, next) => {

        let user;
        let paymentHistory;
        let allBills;
        const categories = await Category.allCategory();       
        const categoryItems = await Category.allCategoryItem();
        const dataForHbs = categories.map((categories) => {
            const items = categoryItems.filter((item) => item.catID === categories.catID);
            return { ...categories, items };
        });
        let token;
        let userToken;
        const cart = req.session.cart;

        if (req.isAuthenticated() || req.user) {
            const body = req.query;
            let error = null;

            if (body.cpOldPassword == '' || body.cpNewPassword == '' || body.cpConfirmNewPassword == '') {
                error = "Lỗi xảy ra! (Vui lòng điền đầy đủ thông tin)";
            }
            else if (body.cpNewPassword != body.cpConfirmNewPassword) {
                error = "Lỗi xảy ra! (Mật khẩu mới và nhập lại mật khẩu mới không trùng nhau)";
            }

            let rs = await User.getUser(body.cpUsername);
            allBills = await billM.selectHoaDon(rs.username);
            user = await paymentM.selectUser(rs.username);
            paymentHistory = await paymentM.selectPaymentByUser(rs.username);
            user = await paymentM.selectUser(rs.username);
            paymentHistory = await paymentM.selectPaymentByUser(rs.username);;
            const userData = req.user;
            userToken = {
                "username": userData.username,
                "password": userData.password
            }
            token = jwt.sign(userToken, 'mysecretkey', { expiresIn: '1h' });

            if (error) {
                res.render('profile', {
                    layout: 'main',
                    account: rs,
                    allBills: allBills, 
                    categories: dataForHbs,
                    cart: cart, 
                    user: user,
                    token: token,
                    paymentHistory: paymentHistory,
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
                        user = await paymentM.selectUser(rs.username);
                        paymentHistory = await paymentM.selectPaymentByUser(rs.username);
                        // console.log("payment History");
                        // console.log(paymentHistory);
                        const userData = req.user;
                        userToken = {
                            "username": userData.username,
                            "password": userData.password
                        }
                        token = jwt.sign(userToken, 'mysecretkey', { expiresIn: '1h' });
                        
                        res.render('profile', { layout: 'main', 
                            account: rs, 
                            allBills: allBills, 
                            categories: dataForHbs,
                            cart: cart, 
                            user: user,
                            token: token,
                            paymentHistory: paymentHistory,
                            success: "Đổi mật khẩu thành công!"
                             });
                        // res.render('profile', {
                        //     layout: 'main',
                        //     account: rs,
                            
                        // });
                    }
                    else {
                        res.render('profile', {
                            layout: 'main',
                            account: rs,
                            allBills: allBills, 
                            categories: dataForHbs,
                            cart: cart, 
                            user: user,
                            token: token,
                            paymentHistory: paymentHistory,
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
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        const categories = await Category.allCategory();       
        const categoryItems = await Category.allCategoryItem();
        const dataForHbs = categories.map((categories) => {
            const items = categoryItems.filter((item) => item.catID === categories.catID);
            return { ...categories, items };
        });
        let accountList = await User.getAllUsers();
        console.log(accountList);
        res.render('account_manager', {
            layout: 'admin',
            accountList: accountList,
            categories: dataForHbs,
        });
    },
    managerRemoveUser: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        let toBeDeletedUser = await User.getUser(req.params.Username);
        if (toBeDeletedUser.username == req.user.username) {
            let accountList = await User.getAllUsers();
            return res.render('account_manager', {
                layout: 'admin',
                accountList: accountList,
                error: 'Bạn đang sử dụng tài khoản này!'
            });
        }
        await User.removeUser(req.params.Username);
        let accountList = await User.getAllUsers();
        res.render('account_manager', {
            layout: 'admin',
            accountList: accountList,
            success: 'Xóa tài khoản thành công!'
        });
    },
    managerEditUser: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        if (await User.checkEmailExist(req.query.MEmail)) {
            let accountList = await User.getAllUsers();
            return res.render('account_manager', {
                layout: 'admin',
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
            layout: 'admin',
            accountList: accountList,
            success: 'Thay đổi thông tin thành công!'
        });
    },
    managerAddUser: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
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
                layout: 'admin',
                accountList: accountList,
                error: error,
            });
        }
        else {
            if (await User.checkUsernameExist(body.MAUsername)) {
                res.render('account_manager', {
                    layout: 'admin',
                    accountList: accountList,
                    error: 'Username đã tồn tại!'
                });
            }
            else if (await User.checkEmailExist(body.MAEmail)) {
                res.render('account_manager', {
                    layout: 'admin',
                    accountList: accountList,
                    error: 'Email này đã được sử dụng!'
                });
            }
            else {
                const pwHashed = await bcrypt.hash(body.MAPassword, saltRounds);
                const newUser = new User({ username: body.MAUsername, password: pwHashed, email: body.MAEmail, isAdmin: body.MARole });
                await User.insertUser(newUser);
                accountList = await User.getAllUsers();
                res.render('account_manager', {
                    layout: 'admin',
                    accountList: accountList,
                    success: 'Thêm tài khoản thành công!'
                });
            }
        }
    },
    getUsersPage: async (req, res, next) => {
        if (!req.isAuthenticated() || req.user == null) {
            return res.redirect('/login');
        }
        if (req.user.isAdmin == false || req.user.isAdmin == null) {
            return res.redirect('/');
        }
        let body = req.query;
        let page = body.page;
        let perPage = body.perPage;
        let data = await User.getUsersPage(page, perPage);
        //console.log(data);
        res.json(data);
    },
}