const db = require('../utilities/database');

module.exports = {
    selectAllBills: async () => {
        await db.selectAllBills();
    },
    addTTHoaDon: async (MaHoaDon, obj) => {
        await db.addTTHoaDon(MaHoaDon, obj);
    },
    insertBill: async (obj) => {
        await db.insertBill(obj);
    },
    selectTTHoaDon: async (MaHD) => {
        await db.selectTTHoaDon(MaHD);
    },
    updateStatus: async (id, status) => {
        await db.updateStatus(id, status);
    }
};
