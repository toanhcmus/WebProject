const db = require('../utilities/database');

module.exports = class User {
    constructor({username, password, email, isAdmin}) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.isAdmin = isAdmin;
    }
    static async insertUser(newUser) {
        await db.insertUser(newUser);
    }
    static async checkUsernameExist(username) {
        return await db.checkUsernameExist(username);
    }
    static async checkEmailExist(email) {
        return await db.checkEmailExist(email);
    }
    static async getPassword(username) {
        return await db.getPassword(username);
    }
    static async editUser(username, newEmail, newPassword) {
        await db.editUser(username, newEmail, newPassword);
    }
    static async removeUser(username) {
        await db.removeUser(username);
    }
    static async getAllUsers() {
        await db.getAllUsers();
    }
    static async getUser(username) {
        const rs = await db.getUser(username);
        if (rs) {
            const u = new User({username: rs.Username, password: rs.Password, email: rs.Email, isAdmin: rs.isAdmin});
            return u;
        }
        return null;
    }
}