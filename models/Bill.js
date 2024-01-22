const db = require('../utilities/database');

module.exports = class Bill {
    constructor(raw) {
        this.MaHoaDon = raw.MaHoaDon;
        this.username = raw.username;
        this.NgayLap = raw.NgayLap;
        this.ThanhTien = raw.ThanhTien;
        this.TrangThai = raw.TrangThai;
    }
    static async selectAllBills() {
        return await db.selectAllBills();
    };
    static async addTTHoaDon(MaHoaDon, obj) {
        await db.addTTHoaDon(MaHoaDon, obj);
    };
    static async insertBill(obj) {
        await db.insertBill(obj);
    };
    static async selectTTHoaDon(MaHD) {
        return await db.selectTTHoaDon(MaHD);
    };
    static async updateStatus(id, status) {
        return await db.updateStatus(id, status);
    }
};
