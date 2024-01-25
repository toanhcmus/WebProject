const db = require('./connectDB_payment');

module.exports = {
    selectAllPayments: async () => {
        const rs = await db.any('SELECT * FROM public."PaymentHistory"');
        return rs;
    },

    addAcc: async (username) => {
        try {
            await db.none(
            'INSERT INTO public."PaymentAccounts"("id", "balance") VALUES ($1, $2)',
            [username, 1000000]
            );
        } catch (error) {
            console.error("Error inserting:", error);
            throw error;
        }
    },
    selectUser: async (id) => {
        const rs = await db.any(
            'SELECT * FROM "PaymentAccounts" WHERE "id" = $1;',
            [id]
        );
        return rs[0];
    },
    selectPayment: async (id) => {
        const rs = await db.any(
            'SELECT * FROM "PaymentHistory" WHERE "maGiaoDich" = $1;',
            [id]
        );
        return rs[0];
    },
    updatePaymentHistory: async (id, status) => {
        const updateQuery = 'UPDATE public."PaymentHistory" SET "TrangThai" = $1 WHERE "maGiaoDich" = $2';
        await db.none(updateQuery, [status, id]);
    },
    addPaymentHistory: async (obj) => {
        try {
            await db.none(
            'INSERT INTO public."PaymentHistory"("id", "money", "TrangThai", "Time") VALUES ($1, $2, $3, $4)',
            [obj.id, obj.money, obj.TrangThai, obj.time]
            );
        } catch (error) {
            console.error("Error inserting:", error);
            throw error;
        }
    },
    updateBalance: async (id, balance) => {
        const updateQuery = 'UPDATE public."PaymentAccounts" SET "balance" = $1 WHERE "id" = $2';
        await db.none(updateQuery, [balance, id]);
    }
}