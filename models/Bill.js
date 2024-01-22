const db = require('../utilities/database');

module.exports = {
    selectAllBills: async () => {
        const rs = await db.any('SELECT * FROM public."HoaDon"');
        return rs;
    },
    addTTHoaDon: async (MaHoaDon, obj) => {
        try {
            await db.none(
            'INSERT INTO public."ThongTinHoaDon"("MaHoaDon", "MaSach", "SoLuong") VALUES ($1, $2, $3)',
            [MaHoaDon, obj.bookId, obj.quantity]
            );
        } catch (error) {
            console.error("Error inserting:", error);
            throw error;
        }
    },
    insertBill: async (obj) => {
        try {
            await db.one(
            'INSERT INTO "HoaDon"("KhachHang", "NgayLap", "ThanhTien") VALUES($1, $2, $3)',
            [obj.makh, obj.date, obj.total]
            );
        } catch (err) {
            console.log("insert bill failed");
        }
    },
    selectHoaDon: async (month, year) => {
        const rs = await db.any(
            'SELECT * FROM "HoaDon" WHERE EXTRACT(YEAR FROM "NgayLap") = $1 AND EXTRACT(MONTH FROM "NgayLap") = $2;',
            [year, month]
        );
        return rs;
    },
    selectTTHoaDon: async (MaHD) => {
        const rs = await db.any(
            'SELECT * FROM "ThongTinHoaDon" WHERE "MaHoaDon" = $1;',
            [MaHD]
        );
        return rs;
    }
};
