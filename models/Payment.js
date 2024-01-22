const db = require("../utilities/db_payment");

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
        return rs;
    },
}