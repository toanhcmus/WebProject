const db = require("../utilities/databasePayment");

module.exports = class Payment {
    constructor(raw) {
        this.id = raw.id;
        this.balance = raw.balance;
    }

    static async selectAllPayments() {
        return await db.selectAllPayments();
    }

    static async addAcc(username) {
        await db.addAcc(username);
    }
    static async selectUser(id) {
        return await db.selectUser(id);
    }
    static async selectPayment(id) {
        return await db.selectPayment(id);
    }
    static async updatePaymentHistory(id, status) {
        await db.updatePaymentHistory(id, status);
    }
    static async addPaymentHistory(obj) {
        await db.addPaymentHistory(obj);
    }
    static async updateBalance(id, balance) {
        await db.updateBalance(id, balance);
    }
}