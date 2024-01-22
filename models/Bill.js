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
        await db.none(
        'INSERT INTO "HoaDon"("username", "NgayLap", "ThanhTien", "TrangThai") VALUES($1, $2, $3, $4)',
        [obj.username, obj.date, obj.total, obj.status]
        );
        
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
    },
    updateStatus: async (id, status) => {
        const updateQuery = 'UPDATE public."HoaDon" SET "TrangThai" = $1 WHERE "id" = $2';
        await db.none(updateQuery, [status, id]);
    }
};
