const db = require('../utilities/database');
const paymentM = require("../models/Payment");

module.exports = class GoogleAccount {
    constructor({Name, Email, Avatar}) {
        this.Name = Name;
        this.Email = Email;
        this.Avatar = Avatar;
    }
    static async insertUser(newUser) {
        await db.insertGoogleUser(newUser);
        const rs = await paymentM.selectUser(newUser.Email);
        if (!rs) {
            await paymentM.addAcc(newUser.Email);
        }
    }
    static async getUser(Name) {
        const rs = await db.getGoogleUser(Name);
        if (rs) {
            const u = new GoogleAccount({Name: rs.Name, Email: rs.Email, Avatar: rs.Avatar});
            return u;
        }
        return null;
    }
    static async getAllUsers() {
        return await db.getAllGoogleUsers();
    }
}