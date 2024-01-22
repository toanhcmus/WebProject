require('dotenv').config();

const pgp = require('pg-promise')({
    capSQL: true
});
const cn = {
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    database: process.env.DB_DB,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    max: 30
};
const db = pgp(cn);

module.exports = {
    allProduct: async () => {
        const data = await db.any(`SELECT * FROM "Products"`);
        return data;
    },
    search: async (name) => {
        const data = await db.any(`SELECT * FROM "Products" WHERE "name" ILIKE '%${name}%'`);
        return data;
    },
    addProduct: async (id, name, tinyDes, fullDes, price, size, items, count, producer, imageUrl) => {
        console.log('Product added');
        const insertQuery = 'INSERT INTO "Products" ("id", "name", "tinyDes", "fullDes", "price", "size", "item", "count", "producer", "images") VALUES ($1, $2, $3, $4, $5, ARRAY[$6], $7, ARRAY[$8], $9, $10)';
        try {
            await db.none(insertQuery, [id, name, tinyDes, fullDes, price, size, items,parseInt(count) , producer, imageUrl]);
            console.log('Product added');
        } catch (error) {
            console.log(error);
        }
      
    },
    sort: async (option) => {
        let data;
        if (option === "decrease") {
            data = await db.any(`SELECT * FROM "Products"  ORDER BY "price" DESC`);
        }
        else if (option === "increase") {
            console.log('incr')
            data = await db.any(`SELECT * FROM "Products"  ORDER BY "price" ASC`);
        }
        else if (option === "az") {
            data = await db.any(`SELECT * FROM "Products"  ORDER BY "name" ASC`);
        }
        else {
            data = await db.any(`SELECT * FROM "Products"  ORDER BY "name" DESC`);
        }
        return data;
    },
    insertUser: async (newUser) => {
        const insertUserQuery = 'INSERT INTO "Users" ("Username", "Password", "Email", "isAdmin") VALUES ($1, $2, $3, $4)';
        const insertUserValues = [newUser.username, newUser.password, newUser.email, newUser.isAdmin];
        try {
            await db.none(insertUserQuery, insertUserValues);
            console.log('User added');
        } catch (error) {
            console.log(error);
        }
    },
    checkUsernameExist: async (username) => {
        const checkUsernameExistQuery = 'SELECT "Username" FROM "Users" WHERE "Username" = $1';
        const checkUsernameExistValues = [username];
        try {
            const checkUsernameExistResult = await db.oneOrNone(checkUsernameExistQuery, checkUsernameExistValues);
            return checkUsernameExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    checkEmailExist: async (email) => {
        const checkEmailExistQuery = 'SELECT "Email" FROM "Users" WHERE "Email" = $1';
        const checkEmailExistValues = [email];
        try {
            const checkEmailExistResult = await db.oneOrNone(checkEmailExistQuery, checkEmailExistValues);
            return checkEmailExistResult ? true : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    editUser: async (username, newEmail, newPassword) => {
        const editUserQuery = 'UPDATE "Users" SET "Email" = $1, "Password" = $2 WHERE "Username" = $3';
        const editUserValues = [newEmail, newPassword, username];
        try {
            await db.none(editUserQuery, editUserValues);
            console.log('User updated');
        } catch (error) {
            console.log(error);
        }
    },
    removeUser: async (username) => {
        const removeUserQuery = 'DELETE FROM "Users" WHERE "Username" = $1';
        const removeUserValues = [username];
        try {
            await db.none(removeUserQuery, removeUserValues);
            console.log('User removed');
        } catch (error) {
            console.log(error);
        }
    },
    getAllUsers: async () => {
        const getAllUsersQuery = 'SELECT * FROM "Users"';
        try {
            const getAllUsersResult = await db.any(getAllUsersQuery);
            return getAllUsersResult;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    getUser: async (username) => {
        const getUserQuery = 'SELECT * FROM "Users" WHERE "Username" = $1';
        const getUserValues = [username];
        try {
            const getUserResult = await db.oneOrNone(getUserQuery, getUserValues);
            return getUserResult;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    getPassword: async (username) => {
        const getPasswordQuery = 'SELECT "Password" FROM "Users" WHERE "Username" = $1';
        const getPasswordValues = [username];
        try {
            const getPasswordResult = await db.oneOrNone(getPasswordQuery, getPasswordValues);
            return getPasswordResult ? getPasswordResult.Password : null;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    allCategory: async () => {
        const data = await db.any(`SELECT * FROM "Categories"`);
        return data;
    },
    allCategoryItem: async () => {
        const data = await db.any(`
        SELECT * FROM "CategoryItems" `);
        return data;
    },
    initDatabase: async function initDatabase() {
        try {
            // Kiểm tra xem database đã tồn tại chưa
            const databaseExists = await db.oneOrNone(
                'SELECT 1 FROM pg_database WHERE datname = $1',
                process.env.DB_NAME
            );

            if (!databaseExists) {
                // Tạo mới database
                await db.none(`CREATE DATABASE ${process.env.DB_NAME}`);
                console.log(`Database ${process.env.DB_NAME} created.`);

                // Kết nối đến database mới tạo
                db.$pool.options.database = process.env.DB_NAME;
                await db.connect();

                // create table inside the new database
                await db.none(`
                /*
                Target Server Type    : PostgreSQL
                Target Server Version : 90600
                File Encoding         : 65001
               */
               
               
               -- ----------------------------
               -- Table structure for Categories
               -- ----------------------------
               DROP TABLE IF EXISTS "Categories";
               CREATE TABLE "Categories" (
                 "catID" serial NOT NULL,
                 "catName" varchar(50) NOT NULL
               )
               ;
               
               -- ----------------------------
               -- Records of Categories
               -- ----------------------------
               BEGIN;
               INSERT INTO "Categories" VALUES (1, 'Thời Trang Nam');
               INSERT INTO "Categories" VALUES (2, 'Thời Trang Nữ');
               INSERT INTO "Categories" VALUES (3, 'Giày Dép Nam');
               INSERT INTO "Categories" VALUES (4, 'Giày Dép Nữ');
               INSERT INTO "Categories" VALUES (5, 'Balo/Túi Nam');
               INSERT INTO "Categories" VALUES (6, 'Túi Ví Nữ');
               INSERT INTO "Categories" VALUES (7, 'Khác');
               COMMIT;
               

               DROP TABLE IF EXISTS "CategoryItems";
               CREATE TABLE "CategoryItems" (
                 "itemID" text NOT NULL,
                 "itemName" varchar(50) NOT NULL,
                 "catID" int4 NOT NULL
               )
               ;
               
               -- ----------------------------
               -- Records of Categories
               -- ----------------------------
               BEGIN;
               INSERT INTO "CategoryItems" VALUES ('ATH', 'Áo Thun Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('AKH', 'Áo Khoác Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('QTA', 'Quần Tây Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('ASM', 'Áo Sơ Mi Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('QJE', 'Quần Jeans Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('CVA', 'Cà Vạt Nam', 1);
               INSERT INTO "CategoryItems" VALUES ('QSH', 'Quần Short Nam', 1);

               INSERT INTO "CategoryItems" VALUES ('ATN', 'Áo Thun Nữ', 2);
               INSERT INTO "CategoryItems" VALUES ('AKN', 'Áo Khoác Nữ', 2);
               INSERT INTO "CategoryItems" VALUES ('ASN', 'Áo Sơ Mi Nữ', 2);
               INSERT INTO "CategoryItems" VALUES ('DLN', 'Đầm/Váy', 2);
               INSERT INTO "CategoryItems" VALUES ('QJN', 'Quần Jeans Nữ', 2);
               INSERT INTO "CategoryItems" VALUES ('QSN', 'Quần Short Nữ', 2);

               INSERT INTO "CategoryItems" VALUES ('GTT', 'Giày Thể thao Nam',3);
               INSERT INTO "CategoryItems" VALUES ('GSN', 'Giày Sục Nam',3);
               INSERT INTO "CategoryItems" VALUES ('GTL', 'Giày Tây',3);
               INSERT INTO "CategoryItems" VALUES ('DSN', 'Sandals Nam',3);
               INSERT INTO "CategoryItems" VALUES ('DNM', 'Dép Nam',3);

               INSERT INTO "CategoryItems" VALUES ('GTN', 'Giày Thể thao Nữ',4);
               INSERT INTO "CategoryItems" VALUES ('GDB', 'Giày Đế bằng',4);
               INSERT INTO "CategoryItems" VALUES ('GCG', 'Giày Cao Gót',4);
               INSERT INTO "CategoryItems" VALUES ('SDN', 'Sandals Nữ',4);
               INSERT INTO "CategoryItems" VALUES ('DNN', 'Dép Nữ',4);

               INSERT INTO "CategoryItems" VALUES ('BLN', 'Balo Nam',5);
               INSERT INTO "CategoryItems" VALUES ('TTN', 'Túi Tote Nam',5);
               INSERT INTO "CategoryItems" VALUES ('TDC', 'Túi Đeo Chéo Nam',5);
               INSERT INTO "CategoryItems" VALUES ('BVM', 'Bóp/Ví Nam',5);

               INSERT INTO "CategoryItems" VALUES ('BAN', 'Balo nữ',6);
               INSERT INTO "CategoryItems" VALUES ('VDT', 'Ví Dự tiệc & Ví cằm tay',6);
               INSERT INTO "CategoryItems" VALUES ('TQX', 'Túi Quai Xách',6);
               INSERT INTO "CategoryItems" VALUES ('TDH', 'Túi Đeo Hông',6);
               INSERT INTO "CategoryItems" VALUES ('PKT', 'Phụ kiện túi',6);

               INSERT INTO "CategoryItems" VALUES ('DHA', 'Đồng Hồ Nam',7);
               INSERT INTO "CategoryItems" VALUES ('DNU', 'Đồng Hồ Nữ',7);
               COMMIT;
        
               -- ----------------------------
               -- Table structure for Products
               -- ----------------------------
               DROP TABLE IF EXISTS "Products";
               CREATE TABLE "Products" (
                 "id" text NOT NULL,
                 "name" varchar(150) NOT NULL,
                 "tinyDes" varchar(150) NOT NULL,
                 "fullDes" text NOT NULL,
                 "price" integer NOT NULL,
                 "size" text[],
                 "item" text ,
                 "count" integer[],
                 "producer" text,
                 "discount" double precision,
                 "images" text,
                )
               ;
               
               -- ----------------------------
               -- Records of Products
               -- ----------------------------
               BEGIN;
            
               INSERT INTO "Products" VALUES ('ATH01','Áo Thun Cổ Rộng','Style đơn giản, thanh lịch, luôn là lựa chọn hàng đầu với số đông mọi người!',
               'Áo Thun Nam hay còn có tên gọi khác là Áo Phông Nam hoặc Áo T Shirt Nam là một trong những item cơ bản không còn xa lạ đối với phong cách thời trang thường ngày của các bạn trẻ hiện nay.               
               Chất vải được dùng trong các thiết kế áo thun essentials bao gồm:               
               Cotton: là chất vải dệt từ sợi bông tự nhiên với tính năng ưu việt thoáng mát, thấm mồ hôi tốt, đây cũng là loại vải phù hợp để sử dụng cho những sản phẩm thể thao nam.
               Cotton pha: là loại vải pha với poly giúp giảm nhăn và tăng độ bền cho sản phẩm.
               Linen: là loại vải 100% dệt từ sợi lanh tự nhiên nên cực kỳ thoáng mát và thấm hút tốt.
               Viscose: là loại vải được chế từ bột giấy hoặc sợi bông với ưu điểm nhẹ và rất thoáng mát.
               Polyester: là sợi vải nhân tạo có khả năng chống nhăn và giữ form tốt.',65000,'{"S","M","L","XL","XXL"}','ATH','{20,56,75,34,82}','Coolmate',0.0,'{}');
               
			   INSERT INTO "Products" VALUES ('ATH02','Áo Thun Len','Áo len nam được sản xuất từ những sợi len chất lượng hàng đầu, đa dạng các mẫu',' 🔰 Chi tiết ÁO LEN CỔ TRÒN
               - Chất liệu: len đan sợi. mềm mịn, không bai xù, không phai màu, không bai dão
               Chính vì được may bằng chất liệu cao cấp nên khi khách hàng sử dụng sẽ không bị ngứa cổ, gây cảm giác khó chịu khi dựng cao cổ áo vào những ngày lạnh.
               - Áo len cổ tròn chắc chắn là item không thể thiếu cho các chàng trai khi mùa đông sắp đến vì tính tiện dụng và khả năng giữ ấm vượt trội. Chỉ cần mặc một chiếc áo len cổ cao bên trong, khoác áo phao siêu nhẹ hoặc áo phao lông vũ bên ngoài là đã đủ để đi qua mùa đông giá buốt này rồi.
               ⏩  Cách chọn size: Shop có bảng size mẫu. Bạn NÊN INBOX, cung cấp chiều cao, cân nặng để SHOP TƯ VẤN SIZE.
               ⏩  Bảng size mẫu
                thông số chọn size cơ bản, tùy thuộc và vào mỗi người mà có thể +/- 1 Size               
               🔰 Hướng dẫn sử dụng sản phẩm
               -Khéo léo kết hợp trang phục cùng phụ kiện, bạn dễ dàng mang lại một set đồ hài hòa, thể hiện được cá tính riêng của bạn
               🔸  Mẹo Nhỏ Giúp Bạn Bảo Quản Quần áo nam : 
               -  Đối với sản phẩm quần áo mới mua về, nên giặt tay lần đâu tiên để tránh phai màu sang quần áo khác
               -  Khi giặt nên lộn mặt trái ra để đảm bảo độ bền 
               -  Sản phẩm phù hợp cho giặt máy/giặt tay
                - Không giặt chung đồ Trắng và đồ Tối màu ',90000,'{"S","M","L","XL","XXL"}','ATH','{10,5,42,65,7}','T&T',0.0,'{}');

               INSERT INTO "Products" VALUES ('ATH03','Áo Polo'
               ,'Áo polo nam đa dạng phong cách, kiểu dáng trẻ trung'
               ,'⭐Bảng size bên shop các bạn tham khảo ạ:
               Size S: Dành cho khách dưới 45 kg    
               Size M: Dành cho khách dưới 50 kg               
               Size L:  Dành cho khách dưới 60 kg               
               Size XL : Dành cho khách dưới 70 cân               
               Size 2XL: Dành cho khách dưới 80 kg                                         
               Bảng size chỉ mang tính chất tham khảo vì còn tùy thuộc vào cơ địa của mỗi bạn ạ               
               👉 Bảng size mang tính chất tham khảo bạn có thể lấy size to hơn hoặc nhỏ theo yêu cầu của bạn!              
               III. MÔ TẢ SẢN PHẨM               
               ⭐ Tên sản phẩm : Áo Polo thun unisex               
               ⭐ Chất Liệu: chất Cotton               
               ⭐ Màu Sắc:   ĐEN, Xanh               
               ⭐ Đặc Tính:  Chất vải áo là chất cotton mặc thoáng mát thấm hút mồ hôi'
               ,85000,'{"S","M","L","XL","XXL"}','ATH','{20,45,65,80,12}','Routine');
               
               INSERT INTO "Products" VALUES ('ATH04','Áo Thun Hoạ Tiết Siêu Nhân'
               ,'Áo thun nam cổ tròn họa tiết siêu nhân giá cực tốt'
               ,'Mô tả
               Chất liệu: Cotton co giãn 4 chiều (95% cotton, 5% spandex) không bai, không xù.
               Áo tay ngắn, cổ tròn, họa tiết cá tính
               Hướng dẫn sử dụng
               Giặt tay trong lần giặt đầu tiên, mẹ nên ngâm và giặt riêng, không giặt chung đồ tối và sáng màu. Sau đó giặt bằng nước lạnh không có xà phòng để hình in mềm hơn, khó bong tróc hơn. Nên giặt sản phẩm bằng nước lạnh hoặc nước ấm dưới 40 độ C. Giặt bằng nước quá nóng có thể làm giãn vải và làm lỏng sản phẩm.
               Bảo quản: Sản phẩm có tính hút ẩm và thấm nước cao. Nên bảo quản áo thun nơi khô ráo.'
               ,78000,'{"S","M","L","XL","XXL"}','ATH','{30,50,61,100,23}','Yame',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATH05','Áo Thun Tay Lỡ'
               ,'Áo thun tay lỡ form rộng, áo phông form rộng'
               ,'Form áo: Các mẫu sản phẩm của shop được thiết kế theo size: siza 4XS ( <5 kg) Size M ( 40kg - 51kg ), Size L ( 52kg - 57kg ), Size XL ( 58kg - 68kg ) mặc đẹp như hình bạn nhé
               CHẤT LIỆU : Chất thun Tici mịn mát, không co rút, dày vừa ko bí, PHÙ HỢP GIÁ TIỀN.
               Màu sắc có thể đậm hoặc nhạt 1-5% do hiệu ứng ánh sáng (có thể do bóng râm, đèn sáng hoặc tối, độ phân giải của máy)           
               - Giặt mặt trái, nhẹ tay, giặt xong phơi ngay, không ngâm áo trong nước quá lâu.               
               - Áo trắng - áo màu nên chia ra giặt riêng, không giặt chung.            
               - Nếu giặt máy thì hình in có thể sẽ tróc theo thời gian'
               ,70000,'{"S","M","L","XL","XXL"}','ATH','{10,15,85,45,23}','SLY',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATH06','Áo Thun Care & Share'
               ,'Áo thun nam Cotton Compact đẹp, thấm hút tốt'
               ,''
               ,109000,'{"S","M","L","XL","XXL"}','ATH','{30,18,64,70,11}','Coolmate',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATH07','Áo Thun ADTStore'
               ,''
               ,''
               ,50000,'{"S","M","L","XL","XXL"}','ATH','{5,7,9,10,11}','ADTStore',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATH08','Áo Thun KPOP In Hình Nhóm Nhạc BLACKPINK'
               ,''
               ,''
               ,150000,'{"S","M","L","XL","XXL"}','ATH','{0,1,5,6,7}','Coolmate',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATH09','Áo Thun Trơn'
               ,''
               ,''
               ,45000,'{"S","M","L","XL","XXL"}','ATH','{10,17,5,61,7}','Yame',0.0,'{}');

               INSERT INTO "Products" VALUES ('AKH01','Áo Khoác Jean'
               ,'Áo polo nam đa dạng phong cách, kiểu dáng trẻ trung'
               ,'⭐Bảng size bên shop các bạn tham khảo ạ:
               Size M: Dành cho khách dưới 50 kg               
               Size L:  Dành cho khách dưới 60 kg               
               Size XL : Dành cho khách dưới 70 cân               
               Size 2XL: Dành cho khách dưới 80 kg                                         
               Bảng size chỉ mang tính chất tham khảo vì còn tùy thuộc vào cơ địa của mỗi bạn ạ               
               👉 Bảng size mang tính chất tham khảo bạn có thể lấy size to hơn hoặc nhỏ theo yêu cầu của bạn!              
               III. MÔ TẢ SẢN PHẨM               
               ⭐ Tên sản phẩm : Áo Polo thun unisex               
               ⭐ Chất Liệu: chất Cotton               
               ⭐ Màu Sắc:   ĐEN, Xanh               
               ⭐ Đặc Tính:  Chất vải áo là chất cotton mặc thoáng mát thấm hút mồ hôi'
               ,145000,'{"S","M","L","XL","XXL"}','AKH','{5,8,7,9,4}','Tommy Hilfiger',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKH02','Áo Khoác Nỉ'
               ,''
               ,''
               ,20500,'{"S","M","L","XL","XXL"}','AKH','{12,85,16,45,32}','Ralph Lauren',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKH03','Áo Khoác Bomber'
               ,''
               ,''
               ,153000,'{"S","M","L","XL","XXL"}','AKH','{14,18,17,12,11}','GRIMM DC',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKH04','Áo Khoác Phao Da Trơn Có Mũ','','',192500,'{"S","M","L","XL","XXL"}','AKH','{9,8,7,4,5}','Now SaiGon',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKH05','Áo Khoác Sọc Caro','','',99500,'{"S","M","L","XL","XXL"}','AKH','{23,42,25,39,27}','Hades',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKH06','Áo Khoác In Hình Sơn Tùng MTP','','',156500,'{"S","M","L","XL","XXL"}','AKH','{1,2,3,4,5}','Yame',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKH07','Áo Khoác Trung Niên Dày','','',215000,'{"S","M","L","XL","XXL"}','AKH','{20,14,16,17,13}','Yame',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKH08','Áo Khoác Style Hàn Quốc','','',137500,'{"S","M","L","XL","XXL"}','AKH','{8,9,7,4,2}','Coolmate',0.0,'{}');

               
               INSERT INTO "Products" VALUES ('QTA01','Quần Tây Dáng Baggy','','',250000,'{"28","29","30","31","32"}','QTA','{5,7,8,9,4}','5S Fashion',0.0,'{}');;
               
               INSERT INTO "Products" VALUES ('QTA02','Quần Tây Vải Thun Lạnh','','',205000,'{"28","29","30","31","32"}','QTA','{18,29,17,14,22}','Yame',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QTA03','Quần Tây Âu Sọc Trắng','','',197000,'{"28","29","30","31","32"}','QTA','{15,25,84,56,23}','SLY',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QTA04','Quần Tây Cap Chun','','',180000,'{"28","29","30","31","32"}','QTA','{12,4,8,5,7}','5S Fashion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QTA05','Quần Tây Ôm Body','','',230000,'{"28","29","30","31","32"}','QTA','{36,45,12,62,12}','Routine',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QTA06','Quần Tây Âu Bam Tab Quần Siêu Co Giãn','','',190000,'{"28","29","30","31","32"}','QTA','{12,45,75,12,56}','Rountine',0.0,'{}');

               INSERT INTO "Products" VALUES ('ASM01','Áo Sơ Mi Trắng','','',100000,'{"S","M","L","XL","XXL"}','ASM','{6,7,4,5,8}','TEELAB',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASM02','Áo Sơ Mi In Hoạ Tiết Phượng Hoàng','','',115000,'{"S","M","L","XL","XXL"}','ASM','{15,26,42,53,12}','TEELAB',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASM03','Áo Sơ Mi Vân Vuông Viền Cổ','','',185000,'{"S","M","L","XL","XXL"}','ASM','{25,1,2,36,45}','TEELAB',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASM04','Áo Sơ Mi Tay Dài','','',175000,'{"S","M","L","XL","XXL"}','ASM','{25,4,10,5,6}','YODY',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASM05','Áo Sơ Mi Tay Ngắn','','',150000,'{"S","M","L","XL","XXL"}','ASM','{7,5,4,9,9}','YODY',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASM06','Áo Sơ Mi Sọc Caro','','',135000,'{"S","M","L","XL","XXL"}','ASM','{18,39,7,24,25}','Coolmate',0.0,'{}');

               INSERT INTO "Products" VALUES ('QJE01','Quần Jeans Ống Suông','','',300000,'{"28","29","30","31","32"}','QJE','{12,25,12,23,24}','Aristino',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJE02','Quần Jeans Ống Đứng Phong Cách Hàn Quốc','','',285000,'{"28","29","30","31","32"}','QJE','{12,14,35,24,12}','Yame',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJE03','Quần Jeans Ôm','','',235000,'{"28","29","30","31","32"}','QJE','{12,26,24,28,29}','Aristino ',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJE04','Quần Jeans Form Rộng','','',178000,'{"28","29","30","31","32"}','QJE','{24,27,21,20,23}','5S Fashion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJE05','Quần Jeans Rách Gối Hiphop','','',234000,'{"28","29","30","31","32"}','QJE','{10,8,7,9,5}','Aristino ',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJE06','Quần Jeans Baggy','','',150000,'{"28","29","30","31","32"}','QJE','{31,36,34,38,25}','Coolmate',0.0,'{}');

               INSERT INTO "Products" VALUES ('CVA01','Cà Vạt Cao Cấp, Chấm Bi','','',80000,'{"L"}','CVA','{25}','Shibumi',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('CVA02','Cà Vạt Caro Dáng Ôm Thời Trang','','',99000,'{"L"}','CVA','{31}','Shibumi',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('CVA03','Cà Vạt Trung Tiên Cao Cấp','','',115000,'{"L"}','CVA','{25}','Marinella',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('CVA04','Cà Vạt Phong Cách Hàn Quốc','','',98000,'{"L"}','CVA','{36}','Marinella',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('CVA05','Combo 3 Cà Vạt','','',250000,'{"L"}','CVA','{38}','Marinella',0.0,'{}');


               INSERT INTO "Products" VALUES ('QSH01','Quần Short Tắm Biển Nam Thời Trang Phong Cách','','',150000,'{"28","29","30"}','QSH','{31,36,34}','5S Fashion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QSH02','Quần Short Baggy Trẻ Trung Năng Động','','',125000,'{"28","29","30"}','QSH','{34,38,25}','Coolmate',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QSH03','Quần Thun Đá Banh','','',100000,'{"28","29","30"}','QSH','{31,22,25}','5S Fashion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QSH04', 'Quần Short Nam Dáng Âu','','',175000,'{"28","29","30"}','QSH','{24,28,26}','Routine',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QSH05', 'Quần Short Nam Mát Mẻ Cho Mùa Hè','','',85000,'{"28","29","30"}','QSH','{36,37,40}','Routine',0.0,'{}');

               
               INSERT INTO "Products" VALUES ('ATN01','Áo Thun Cổ Tròn Cá Tính','','',150000,'{"S","M","L"}','ATN','{45,26,35}','Demi',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATN02','Áo Thun Nữ Tay Ngắn Cotton Tinh Khiết','','',115000,'{"S","M","L"}','ATN','{55,54,58}','5S Fashion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATN03','Áo Gigle Logo Phoxe','','',185000,'{"S","M","L"}','ATN','{31,36,34}','5S Fashion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATN04','Áo Thun Dài Tay Cổ Chữ V','','',198000,'{"S","M","L"}','ATN','{25,28,29}','5S Fashion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATN05','Áo Thun Tay Lỡ Màu Trơn In Hình BTS','','',85000,'{"S","M","L"}','ATN','{36,35,34}','Demi',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATN06', 'Áo Thun Ngắn Tay Sọc Caro Phong Cách','','',95000,'{"S","M","L"}','ATN','{11,12,15}','Demi',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ATN07','Áo Thun Cotton Polo Nhí Nhảnh','','',175000,'{"S","M","L"}','ATN','{8,9,7}','Coolmate',0.0,'{}');


               INSERT INTO "Products" VALUES ('AKN01','Áo Khoác Nỉ Thể Thao','','',195000,'{"S","M","L"}','AKN','{24,25,26}','Yame',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKN02','Áo Khoác Dù Nữ Kiểu 2 Lớp Form Rộng','','',215000,'{"S","M","L"}','AKN','{35,36,38}','Yame',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKN03','Áo Khoác Gió Nữ 2 Lớp Chống Nước, Có Mũ','','',225000,'{"S","M","L"}','AKN','{30,31,32}','Yame',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKN04','Áo Khoác Có Nón, Vải Thun Giữ Ấm','','',300000,'{"S","M","L"}','AKN','{31,36,34}','Coolmate',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('AKN05','Áo Khoác Jeans Cá Tính','','',275000,'{"S","M","L"}','AKN','{11,12,14}','Routine',0.0,'{}');

               INSERT INTO "Products" VALUES ('ASN01','Áo Sơ Mi Công Sở Dài Tay','','',275000,'{"S","M","L"}','ASN','{11,12,14}','Routine',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASN02','Áo Sơ Mi Nữ Form Rộng Kiểu Hàn','','',275000,'{"S","M","L"}','ASN','{11,12,14}','Routine',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASN03','Áo Sơ Mi Trắng','','',275000,'{"S","M","L"}','ASN','{11,12,14}','Routine',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASN04','Áo Sơ Mi Nữ Kẻ Sọc','','',275000,'{"S","M","L"}','ASN','{11,12,14}','Routine',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASN05','Áo Sơ Mi Nhung Quốc Dân','','',275000,'{"S","M","L"}','ASN','{11,12,14}','Routine',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('ASN06','Áo Sơ Mi Tay Ngắn','','',275000,'{"S","M","L"}','ASN','{11,12,14}','Routine',0.0,'{}');

               INSERT INTO "Products" VALUES ('DLN01','Đầm Voan Cao Cấp, 3 Tầng Thời Trang','','',255000,'{"S","M","L"}','DLN','{11,12,14}','Fleur Studio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DLN02','Đầm Chữ A Tay Ngắn Cổ Tròn','','',285000,'{"S","M","L"}','DLN','{24,25,26}','Fleur Studio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DLN03','Đầm Váy Trắng Cổ V','','',180000,'{"S","M","L"}','DLN','{11,12,15}','Fleur Studio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DLN04','Váy Công Chúa Gấm Xốp Phối Voan','','',300000,'{"S","M","L"}','DLN','{24,25,26}','Fleur Studio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DLN05','Đầm Nữ Thời Trang','','',260000,'{"S","M","L"}','DLN','{11,12,17}','Dottie',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DLN06','Váy Suông Sơ Mi Túi Hộp','','',275000,'{"S","M","L"}','DLN','{24,25,28}','Dottie',0.0,'{}');

               INSERT INTO "Products" VALUES ('QJN01','Quần Jeans Ống Rộng Nữ','','',295000,'{"26","27","28"}','QJN','{11,12,14}','Fleur Studio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJN02','Quần Jeans Baggy 2 Túi Trước','','',270000,'{"26","27","28"}','QJN','{28,26,24}','Dottie',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJN03','Quần Jeans Nữ Ống Đứng Hơi Ôm','','',180000,'{"26","27","28"}','QJN','{30,36,38}','Fleur Studio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJN04','Quần Jeans Nữ Thời Trang Cá Tính','','',199000,'{"26","27","28"}','QJN','{10,15,19}','Dottie',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QJN05','Quần Jeans Nữ Baggy Ống Suông','','',189000,'{"26","27","28"}','QJN','{8,9,7}','Fleur Studio',0.0,'{}');

               INSERT INTO "Products" VALUES ('QSN01','Quần Đùi Nữ Chất Kaki','','',167000,'{"26","27","28"}','QSN','{8,9,7}','Dottie',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QSN02','Quần Short Nữ Cạp Chun','','',243000,'{"26","27","28"}','QSN','{30,36,31}','Fleur Studio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QSN03','Quần Short Đùi Đan Dây Hai Bên','','',210000,'{"26","27","28"}','QSN','{8,9,4}','Fleur Studio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QSN04','Quần Short Jeans','','',285000,'{"26","27","28"}','QSN','{30,36,38}','Dottie',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('QSN05','Quần Short Nữ Ống Rộng','','',185000,'{"26","27","28"}','QSN','{30,36,33}','Routine',0.0,'{}');

               INSERT INTO "Products" VALUES ('GTT01','Giày Thể Thao Nam Bitis','','',1250000,'{"39","40","41","42","43"}','GTT','{15, 22, 18, 27, 19}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTT02','Giày Thể Thao Chạy Bộ Nam Adidas','','',980000,'{"39","40","41","42","43"}','GTT','{20, 25, 14, 31, 16}','Adidas',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTT03','Giày Thể Thao Thông Dụng Nam Bitis','','',1750000,'{"39","40","41","42","43"}','GTT','{317, 28, 26, 21, 24}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTT04','Giày Chạy Bộ Nam','','',1150000,'{"39","40","41","42","43"}','GTT','{29, 30, 16, 23, 14}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTT05','Giày Đi Bộ Thể Dục Cho Nam','','',1850000,'{"39","40","41","42","43"}','GTT','{19, 27, 31, 15, 22}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTT06','Giày Leo Núi Dã Ngoại Chống Thấm Nước','','',1600000,'{"39","40","41","42","43"}','GTT','{18, 20, 29, 14, 26}','Adidas',0.0,'{}');

               INSERT INTO "Products" VALUES ('GSN01','Giày Sục Nam','','',1100000,'{"39","40","41","42","43"}','GSN','{23, 28, 15, 30, 19}','Thế Giới Đồ Da',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GSN02','Giày Sục Nam Da Thật Quai Chữ H','','',1450000,'{"39","40","41","42","43"}','GSN','{14, 18, 24, 29, 16}','Thế Giới Đồ Da',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GSN03','Giày Mules Nam Mũi Tròn Hở Gót Thời Trang','','',1950000,'{"39","40","41","42","43"}','GSN','{25, 17, 27, 21, 30}','Thế Giới Đồ Da',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GSN04','Giày Mule Thời Trang Playball Monogram','','',1350000,'{"39","40","41","42","43"}','GSN','{22, 19, 28, 20, 31}','Thế Giới Đồ Da',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GSN05','Giày Sục Nam Da Bò Chính Hãng','','',1250000,'{"39","40","41","42","43"}','GSN','{22, 19, 28, 20, 31}','Thế Giới Đồ Da',0.0,'{}');


               INSERT INTO "Products" VALUES ('GTL01','Giày Tây Nam Zuciani Derby Thắt Dây Da Dập Vân','','',980000,'{"39","40","41","42","43"}','GTL','{16, 21, 29, 27, 18}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTL02','Giày Tây MCKAY Đế Phối Da','','',1750000,'{"39","40","41","42","43"}','GTL','{20, 25, 14, 31, 16}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTL03','Giày Tây Nam Zuciani Hoạ Tiến Đục Lỗ Thắt Dây Da Dập Vuông','','',1150000,'{"39","40","41","42","43"}','GTL','{17, 28, 26, 21, 24}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTL04','Giày Tây Nam Bitis','','',1850000,'{"39","40","41","42","43"}','GTL','{29, 30, 16, 23, 14}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTL05','Giày Tây Boot Nam Bitis','','',1700000,'{"39","40","41","42","43"}','GTL','{19, 27, 31, 15, 22}','Đông Hải',0.0,'{}');

               INSERT INTO "Products" VALUES ('DSN01','Sandal Thể Thao Eva Phun Nam Bitis Hunter','','',1550000,'{"39","40","41","42","43"}','DSN','{15, 22, 18, 27, 19}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DSN02','Sandal Nam Bitis Hunter Tonic','','',1200000,'{"39","40","41","42","43"}','DSN','{20, 25, 14, 31, 16}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DSN03','Sandal Nam Hunter X Blazin Neon Collection','','',1650000,'{"39","40","41","42","43"}','DSN','{17, 28, 26, 21, 24}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DSN04','Sandal Si Cao Su Nam Bitis','','',1900000,'{"39","40","41","42","43"}','DSN','{29, 30, 16, 23, 14}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DSN05','Sandal Quai Ngang Thời Trang Kiểu Dáng Streetwear Mang Đi Học','','',1400000,'{"39","40","41","42","43"}','DSN','{22, 19, 28, 20, 31}','Bitis',0.0,'{}');


               INSERT INTO "Products" VALUES ('DNM01','Dép Da Nam Bitis','','',1120000,'{"39","40","41","42","43"}','DNM','{18, 20, 29, 14, 26}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNM02','Dép Thông Dụng Si Đế TPR Nam Bitis','','',1800000,'{"39","40","41","42","43"}','DNM','{23, 28, 15, 30, 19}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNM03','DÉP NAM ĐÔNG HẢI QUAI NGANG CÁCH ĐIỆU ĐAN CHÉO','','',950000,'{"39","40","41","42","43"}','DNM','{14, 18, 24, 29, 16}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNM04','DÉP NAM ĐÔNG HẢI QUAI NGANG CUT-OUT CÁCH ĐIỆU','','',1700000,'{"39","40","41","42","43"}','DNM','{19, 27, 31, 15, 22}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNM05','DÉP QUAI NGANG ĐÔNG HẢI CHẦN CHỈ THỜI TRANG','','',1300000,'{"39","40","41","42","43"}','DNM','{25, 17, 27, 21, 30}','Đông Hải',0.0,'{}');

               INSERT INTO "Products" VALUES ('GTN01','Giày Thể Thao Nữ Gosto','','',1250000,'{"39","40","41","42","43"}','GTN','{16, 21, 29, 27, 18}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTN02','Giày Thông Dụng Nữ Bitis','','',980000,'{"39","40","41","42","43"}','GTN','{20, 25, 14, 31, 16}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTN03','Giày Thể Thao Nữ Bitis Êmbrace','','',1150000,'{"39","40","41","42","43"}','GTN','{17, 28, 26, 21, 24}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTN04','Giày Thể Thao Kháng Khuẩn','','',1450000,'{"39","40","41","42","43"}','GTN','{29, 30, 16, 23, 14}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GTN05','Giày Thể Thao Êm Chân Siêu Nhẹ','','',950000,'{"39","40","41","42","43"}','GTN','{19, 27, 31, 15, 22}','Bitis',0.0,'{}');

               INSERT INTO "Products" VALUES ('GDB01','Giày Đế Bằng Thời Trang Nữ Hiệu Exull','','',1350000,'{"36","37","38","39","40"}','GDB','{18, 20, 29, 14, 26}','Exull Mode',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GDB02','Giày Sling Back Đế Vuông Nữ Exull','','',1120000,'{"36","37","38","39","40"}','GDB','{23, 28, 15, 30, 19}','Exull Mode',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GDB03','Giày Loafer Đế Bằng Thời Trang','','',1200000,'{"36","37","38","39","40"}','GDB','{14, 18, 24, 29, 16}','Exull Mode',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GDB04','Giày Búp Bê Mũi Nhọn','','',1250000,'{"36","37","38","39","40"}','GDB','{25, 17, 27, 21, 30}','Exull Mode',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GDB05','Giày Sục Đế Bằng Exull','','',980000,'{"36","37","38","39","40"}','GDB','{22, 19, 28, 20, 31}','Exull Mode',0.0,'{}');

               INSERT INTO "Products" VALUES ('GCG01','Giày Bít Mũi Nhọn Stiletto Heel','','',1150000,'{"36","37","38","39","40"}','GCG','{26, 15, 22, 31, 16}','Vascara',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GCG02','Giày Cao Gót Gót Trụ Phối Khoá','','',1450000,'{"36","37","38","39","40"}','GCG','{19, 24, 12, 30, 28}','Juno',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GCG03','Giày Cao Gót Khoá Trang Trí Kim Loại','','',1400000,'{"36","37","38","39","40"}','GCG','{27, 16, 29, 18, 21}','Juno',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GCG04','Giày Cao Gót Pump Mũi Nhọn Gót Thanh','','',1050000,'{"36","37","38","39","40"}','GCG','{20, 25, 29, 14, 22}','Juno',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('GCG05','Giày Cao Gót Bít Mũi Gót Thanh','','',1550000,'{"36","37","38","39","40"}','GCG','{18, 31, 15, 23, 20}','Juno',0.0,'{}');

               INSERT INTO "Products" VALUES ('SDN01','Sandal Thời Trang Nữ Bitis','','',1280000,'{"36","37","38","39","40"}','SDN','{30, 13, 26, 17, 22}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('SDN02','Giày Sandal Mũi Vuông Gót Si Hiệu Ứng Aluminium','','',930000,'{"36","37","38","39","40"}','SDN','{24, 28, 14, 21, 19}','Vascara',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('SDN03','Sandal Strappy Quai Phồng','','',1320000,'{"36","37","38","39","40"}','SDN','{15, 22, 18, 27, 19}','Vascara',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('SDN04','Sandal Si Cao Su Nữ Bitis','','',1180000,'{"36","37","38","39","40"}','SDN','{20, 25, 14, 31, 16}','Bitis',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('SDN05','Giày Sandal Đế Chunky Phối Vân Da Kỳ Đà','','',1500000,'{"36","37","38","39","40"}','SDN','{17, 28, 26, 21, 24}','Balo Mini Nhấn Túi Phụ Vân Da Kỳ Đ',0.0,'{}');

               INSERT INTO "Products" VALUES ('DNN01','DÉP XUỒNG ZUCIA ĐẾ GIẢ GỖ QUAI THỜI TRANG','','',1420000,'{"36","37","38","39","40"}','DNN','{29, 30, 16, 23, 14}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNN02','DÉP NỮ ZUCIA QUAI CÁCH ĐIỆU CUT-OUT','','',990000,'{"36","37","38","39","40"}','DNN','{19, 27, 31, 15, 22}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNN03','DÉP NỮ ZUCIA DA MỀM HỌA TIẾT ĐAN CHÉO','','',1030000,'{"36","37","38","39","40"}','DNN','{23, 28, 15, 30, 19}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNN04','DÉP NỮ ZUCIA KHÓA TRÒN GIẢ GỖ THỜI TRANG','','',1100000,'{"36","37","38","39","40"}','DNN','{14, 18, 24, 29, 16}','Đông Hải',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNN05','DÉP XUỒNG NỮ QUAI DÂY BẢNG NGANG','','',1210000,'{"36","37","38","39","40"}','DNN','{25, 17, 27, 21, 30}','Đông Hải',0.0,'{}');

               INSERT INTO "Products" VALUES ('BLN01','Túi Đeo Chéo Style Mạnh Mẽ, Phong Cách Cực Chất BANGE GEKMAN','','',1210000,'{"L"}','BLN','{30}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BLN02','Balo Du Lịch Cao Cấp, Sức Chứa Khủng Hơn Vali','','',1210000,'{"L"}','BLN','{45}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BLN03','Balo Đa Năng Cao Cấp, Thiết Kế Siêu Thông Minh','','',1210000,'{"L"}','BLN','{51}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BLN04','Balo Đa Năng Cao Cấp ROKIN MASTER','','',1210000,'{"L"}','BLN','{50}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BLN05','Balo Laptop Cao Cấp, Style Cực Chất Sành Điệu BANGE GRANDE','','',1210000,'{"L"}','BLN','{32}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BLN06','Balo Chống Trộm, Thiết Kế Đẳng Cấp MARK RYDEN DELTA','','',1210000,'{"L"}','BLN','{42}','Big Bag',0.0,'{}');            

               INSERT INTO "Products" VALUES ('TTN01','Túi Georges Tote MM','','',1210000,'{"L"}','TTN','{27}','Louis Vuitton',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('TTN02','Túi Shopper Bag MM','','',1210000,'{"L"}','TTN','{29}','Louis Vuitton',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('TTN03','PEDRO - Túi Tote Nam Form Vuông Thời Trang','','',1210000,'{"L"}','TTN','{24}','Masion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('TTN04','MLB - Túi Tote Unisex Chữ Nhật Canvas Vertical','','',1210000,'{"L"}','TTN','{28}','Masion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('TTN05','Túi Tote Nam Form Chữ Nhật Recycled Leather','','',1210000,'{"L"}','TTN','{20}','Masion',0.0,'{}');

               INSERT INTO "Products" VALUES ('TDC01','Túi Đeo Chéo Ngang MIKKOR THE FELIX','','',1210000,'{"L"}','TDC','{35}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('TDC02','Túi Đeo Chéo Thiết Kế Tối Giản MARK RYDEN SECRET','','',1210000,'{"L"}','TDC','{31}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('TDC03','Túi Đeo Chéo Mini, Thiết kế Siêu Gọn & Nhẹ MARK RYDEN AIR','','',1210000,'{"L"}','TDC','{52}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('TDC04','Túi Đeo Chéo Tối Giản, Thiết Kế Nhỏ Gọn','','',1210000,'{"L"}','TDC','{56}','Big Bag',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('TDC05','Túi Đeo Chéo Đơn Giản, Nhỏ Gọn','','',1210000,'{"L"}','TDC','{24}','Big Bag',0.0,'{}');

               INSERT INTO "Products" VALUES ('BVM01','Ví Mini Leo De Gol','','',1210000,'{"L"}','BVM','{44}','Leonardo',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BVM02','Ví Card Monogram Carlos','','',1210000,'{"L"}','BVM','{40}','Leonardo',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BVM03','Ví Card Livermore','','',1210000,'{"L"}','BVM','{43}','Leonardo',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BVM04','Ví Cầm Tay Nam Da Cá Sấu','','',1210000,'{"L"}','BVM','{34}','Gento',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BVM05','Ví Cầm Tay Nam Da Cá Sấu Cao Cấp Gento ','','',1210000,'{"L"}','BVM','{32}','Gento',0.0,'{}');

               INSERT INTO "Products" VALUES ('BAN01','Balo Mini Nhấn Túi Phụ Vân Da Kỳ Đà','','',1210000,'{"L"}','BAN','{22}','Vascara',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BAN02','Balo Mini Nhấn Khóa Túi Hộp','','',1210000,'{"L"}','BAN','{33}','Vascara',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BAN03','Ba Lô Nữ TJW Essential Backpack','','',1210000,'{"L"}','BAN','{44}','ACFC',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BAN04','Balo Nữ IM Latam Corp Backpack','','',1210000,'{"L"}','BAN','{55}','ACFC',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('BAN05','Ba Lô Nữ Ryan Travel','','',1210000,'{"L"}','BAN','{11}','ACFC',0.0,'{}');

               INSERT INTO "Products" VALUES ('VDT01','Ví Cầm Tay Top-Zip Nhiều Ngăn','','',1210000,'{"L"}','VDT','{56}','Vascara',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('VDT02','Ví Cầm Tay May Chần Bông Hình Thoi','','',1210000,'{"L"}','VDT','{45}','Vascara',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('VDT03','Ví Mini Dập Nổi Square Pattern ','','',1210000,'{"L"}','VDT','{34}','Vascara',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('VDT04','Ví Cầm Tay Zip-Around Dập Vân Cá Sấu','','',1210000,'{"L"}','VDT','{23}','Vascara',0.0,'{}');

               INSERT INTO "Products" VALUES ('PKT01','Móc Khóa Nữ Hình Thú Bông Phối Lông Vũ','','',1210000,'{"L"}','PKT','{12}','Masion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('PKT02','Móc Khóa Nữ Hình Thú Bông Lông Xù Cute','','',1210000,'{"L"}','PKT','{21}','Masion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('PKT03','Dây Đeo Túi Xách Bản Rộng','','',1210000,'{"L"}','PKT','{32}','Masion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('PKT04','Móc Khóa Nữ Hình Thú Bông','','',1210000,'{"L"}','PKT','{54}','Masion',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('PKT05','Dây Đeo Túi Xách Vải Bản Vừa','','',1210000,'{"L"}','PKT','{34}','Masion',0.0,'{}');

               INSERT INTO "Products" VALUES ('DHA01','Longines - Nam','','',1210000,'{"L"}','DHA','{51}','Longines',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DHA02','Olym Pianus - Nam','','',1210000,'{"L"}','DHA','{27}','Olym Pianus',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DHA03','Casio - Nam','','',1210000,'{"L"}','DHA','{26}','Casio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DHA04','Tissot - Nam','','',1210000,'{"L"}','DHA','{22}','Tissot',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DHA05','Bonest Gatti - Nam','','',1210000,'{"L"}','DHA','{20}','Bonest Gatti',0.0,'{}');

               INSERT INTO "Products" VALUES ('DNU01','SRWatch - Nữ','','',1210000,'{"L"}','DNU','{37}','SRWatch',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNU02','Casio - Nữ','','',1210000,'{"L"}','DNU','{38}','Casio',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNU03','Tissot - Nữ','','',1210000,'{"L"}','DNU','{39}','Tissot',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNU04','Seiko - Nữ','','',1210000,'{"L"}','DNU','{40}','Seiko',0.0,'{}');
               
               INSERT INTO "Products" VALUES ('DNU05','Orient - Nữ','','',1210000,'{"L"}','DNU','{5}','Orient',0.0,'{}');

               COMMIT;
                              
               -- ----------------------------
               -- Table structure for Users
               -- ----------------------------
               DROP TABLE IF EXISTS "Users";
               CREATE TABLE "Users" (
                "Username" text NOT NULL,
                "Password" text NOT NULL,
                "isAdmin" boolean NOT NULL,
                "Email" text
               )
               ;
           
                INSERT INTO "Users" ("Username", "Password", "isAdmin", "Email") VALUES
                ('12', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', false, '123@ok'),
                ('Admin', '$2b$10$7u5D8nN.a.ffUYmnjkrs9uiSnkKHCQK3t5M/KD1hhyaLRnMbgdFXe', true, NULL);
               -- ----------------------------
               -- Table structure for OrderDetails
               -- ----------------------------
               DROP TABLE IF EXISTS "OrderDetails";
               CREATE TABLE "OrderDetails" (
                 "ID" serial NOT NULL,
                 "OrderID" int4 NOT NULL,
                 "ProID" int4 NOT NULL,
                 "Quantity" int4 NOT NULL,
                 "Price" numeric(19,4) NOT NULL,
                 "Amount" numeric(19,4) NOT NULL
               )
               ;
               
               -- ----------------------------
               -- Records of OrderDetails
               -- ----------------------------
               BEGIN;
               INSERT INTO "OrderDetails" VALUES (1, 1, 1, 2, 1500000.0000, 3000000.0000);
               INSERT INTO "OrderDetails" VALUES (2, 1, 2, 2, 300000.0000, 600000.0000);
               INSERT INTO "OrderDetails" VALUES (3, 2, 1, 1, 1500000.0000, 1500000.0000);
               INSERT INTO "OrderDetails" VALUES (4, 2, 2, 1, 300000.0000, 300000.0000);
               COMMIT;
               
               -- ----------------------------
               -- Table structure for Orders
               -- ----------------------------
               DROP TABLE IF EXISTS "Orders";
               CREATE TABLE "Orders" (
                 "OrderID" serial NOT NULL,
                 "OrderDate" timestamp NOT NULL,
                 "UserID" int4 NOT NULL,
                 "Total" numeric(19,4) NOT NULL
               )
               ;
               
               -- ----------------------------
               -- Records of Orders
               -- ----------------------------
               BEGIN;
               INSERT INTO "Orders" VALUES (1, '2014-03-14 00:00:00.000', 5, 3600000.0000);
               INSERT INTO "Orders" VALUES (2, '2014-03-14 00:00:00.000', 5, 1800000.0000);
               COMMIT;
               -- ----------------------------
               -- Primary Key structure for table Categories
               -- ----------------------------
               ALTER TABLE "Categories" ADD CONSTRAINT "PK__Categori" PRIMARY KEY ("catID") WITH (fillfactor=80);
               ALTER TABLE "CategoryItems" ADD CONSTRAINT "PK__CategoryItems" PRIMARY KEY ("itemID") WITH (fillfactor=80);
               -- ----------------------------
               -- Primary Key structure for table OrderDetails
               -- ----------------------------
               ALTER TABLE "OrderDetails" ADD CONSTRAINT "PK__OrderDet" PRIMARY KEY ("ID") WITH (fillfactor=80);
               
               -- ----------------------------
               -- Primary Key structure for table Orders
               -- ----------------------------
               ALTER TABLE "Orders" ADD CONSTRAINT "PK__Orders" PRIMARY KEY ("OrderID") WITH (fillfactor=80);
               
               -- ----------------------------
               -- Primary Key structure for table Products
               -- ----------------------------
               ALTER TABLE "Products" ADD CONSTRAINT "PK__Products" PRIMARY KEY ("id") WITH (fillfactor=80);
               
               -- ----------------------------
               -- Primary Key structure for table Users
               -- ----------------------------
               ALTER TABLE "Users" ADD CONSTRAINT "PK__Users" PRIMARY KEY ("Username") WITH (fillfactor=80);
               
               -- ----------------------------
               -- Foreign Keys structure for table OrderDetails
               -- ----------------------------
               
               
               -- ----------------------------
               -- Foreign Keys structure for table Products
               -- ----------------------------
               ALTER TABLE "Products" ADD CONSTRAINT "FK_Cat" FOREIGN KEY ("item") REFERENCES "CategoryItems" ("itemID");
               
               ALTER TABLE "CategoryItems" ADD CONSTRAINT "FK_CatItem" FOREIGN KEY ("catID") REFERENCES "Categories" ("catID");

                `);

                console.log(`Tables created inside '${process.env.DB_NAME}' database.`);
                console.log(`Data imported into '${process.env.DB_NAME}' database.`);
            }
            else {
                db.$pool.options.database = process.env.DB_NAME;
                await db.connect();
                console.log(`Database '${process.env.DB_NAME}' already exists. Cannot create database.`);
            }
        }
        catch (error) {
            console.log(error);
        }
    },
    //db: db,
}