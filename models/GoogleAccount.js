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
        console.log(rs);
        if (rs === undefined) {
            await paymentM.addAcc(newUser.Email);
        }
    }
    static async getUser(Email) {
        const rs = await db.getGoogleUser(Email);
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