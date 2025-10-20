-- Thêm 40 sản phẩm mới (tên trước, ảnh sau)
INSERT INTO products (name, description, price, category, pet_type, brand, stock, seller_id, image_url) VALUES
-- Thức ăn cho chó
('Pedigree Adult Chicken & Vegetables 10kg', 'Thức ăn dinh dưỡng cho chó trưởng thành với thịt gà và rau củ', 450000, 'food', 'dog', 'Pedigree', 50, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Royal Canin Medium Adult 15kg', 'Thức ăn cao cấp cho chó giống trung bình', 1200000, 'food', 'dog', 'Royal Canin', 30, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('NutriSource Senior 13kg', 'Thức ăn chuyên biệt cho chó cao tuổi', 950000, 'food', 'dog', 'NutriSource', 25, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Ganador Puppy 20kg', 'Thức ăn cho chó con đang phát triển', 850000, 'food', 'dog', 'Ganador', 40, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Pro Plan Adult Performance 14kg', 'Thức ăn năng lượng cao cho chó hoạt động nhiều', 1100000, 'food', 'dog', 'Pro Plan', 35, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Taste of the Wild 12.7kg', 'Thức ăn tự nhiên không ngũ cốc', 1300000, 'food', 'dog', 'Taste of the Wild', 20, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Cesar Wet Food Chicken 100g (24 packs)', 'Thức ăn ướt cao cấp hương vị gà', 480000, 'food', 'dog', 'Cesar', 60, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Acana Heritage 11.4kg', 'Thức ăn tươi từ nguyên liệu địa phương', 1450000, 'food', 'dog', 'Acana', 15, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),

-- Thức ăn cho mèo
('Whiskas Ocean Fish 7kg', 'Thức ăn mèo vị cá biển', 320000, 'food', 'cat', 'Whiskas', 55, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Me-O Persian Cat 7kg', 'Thức ăn cho mèo Ba Tư', 380000, 'food', 'cat', 'Me-O', 45, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('SmartHeart Kitten 8kg', 'Thức ăn cho mèo con', 350000, 'food', 'cat', 'SmartHeart', 50, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Reflex Plus Adult Cat Chicken 15kg', 'Thức ăn mèo trưởng thành vị gà', 650000, 'food', 'cat', 'Reflex Plus', 30, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Royal Canin Kitten 10kg', 'Thức ăn cao cấp cho mèo con', 980000, 'food', 'cat', 'Royal Canin', 25, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Minino Yum Tuna Wet Food 80g (24 cans)', 'Pate mèo vị cá ngừ', 360000, 'food', 'cat', 'Minino', 70, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Kit Cat Chicken Rice 5kg', 'Thức ăn mèo gà và gạo', 280000, 'food', 'cat', 'Kit Cat', 40, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Kitekat Mackerel 7kg', 'Thức ăn mèo vị cá thu', 290000, 'food', 'cat', 'Kitekat', 50, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),

-- Đồ chơi
('Kong Classic Dog Toy Large', 'Đồ chơi cao su bền cho chó lớn', 180000, 'toy', 'dog', 'Kong', 100, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Feather Wand Cat Toy', 'Đồ chơi cần câu lông vũ cho mèo', 45000, 'toy', 'cat', 'Generic', 150, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Rubber Ball Set (6 pack)', 'Bộ 6 bóng cao su nhiều màu', 95000, 'toy', 'dog', 'Pet Toys', 120, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Laser Pointer Cat Toy', 'Đèn laser tương tác cho mèo', 65000, 'toy', 'cat', 'Generic', 80, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Rope Tug Toy Large', 'Đồ chơi dây thừng cho chó', 120000, 'toy', 'dog', 'Pet Fun', 90, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Cat Tunnel 3-Way', 'Đường hầm chơi 3 ngả cho mèo', 280000, 'toy', 'cat', 'Cat Life', 40, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Interactive Treat Ball', 'Bóng thông minh phát thưởng', 150000, 'toy', 'dog', 'Smart Pet', 60, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),

-- Phụ kiện
('Adjustable Collar Medium', 'Vòng cổ điều chỉnh được size M', 85000, 'accessory', 'dog', 'Pet Gear', 100, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Retractable Leash 5m', 'Dây dắt tự động 5 mét', 180000, 'accessory', 'dog', 'Flexi', 80, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Stainless Steel Bowl Set', 'Bộ 2 bát inox cao cấp', 120000, 'accessory', 'dog', 'Pet Dining', 70, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Cat Litter Box with Cover', 'Khay vệ sinh mèo có nắp', 350000, 'accessory', 'cat', 'Cat Clean', 45, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Pet Carrier Backpack', 'Ba lô vận chuyển thú cưng', 450000, 'accessory', 'cat', 'Pet Travel', 30, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Cooling Mat Large', 'Đệm làm mát size lớn', 280000, 'accessory', 'dog', 'Cool Pet', 50, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('GPS Pet Tracker', 'Thiết bị định vị GPS cho thú cưng', 650000, 'accessory', 'dog', 'Tech Pet', 25, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),

-- Thuốc và chăm sóc sức khỏe
('Multivitamin for Dogs 60 tablets', 'Vitamin tổng hợp cho chó', 180000, 'medicine', 'dog', 'Pet Health', 100, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Flea and Tick Treatment', 'Thuốc trị ve rận', 220000, 'medicine', 'dog', 'Frontline', 80, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Dewormer for Cats', 'Thuốc tẩy giun cho mèo', 95000, 'medicine', 'cat', 'Drontal', 90, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Joint Supplement for Senior Dogs', 'Thực phẩm bổ sung xương khớp', 350000, 'medicine', 'dog', 'Cosequin', 60, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Probiotic Powder', 'Men vi sinh cho thú cưng', 180000, 'medicine', 'dog', 'FortiFlora', 70, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Dental Care Spray', 'Xịt chăm sóc răng miệng', 120000, 'medicine', 'cat', 'Pet Dent', 85, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),

-- Vệ sinh và làm đẹp
('Slicker Brush', 'Lược chải lông tự động', 120000, 'grooming', 'dog', 'Pet Grooming', 90, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Pet Nail Clipper', 'Kìm cắt móng chuyên dụng', 85000, 'grooming', 'cat', 'Safari', 100, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Waterless Shampoo Spray', 'Dầu gội khô dạng xịt', 150000, 'grooming', 'dog', 'Fresh Pet', 75, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Pet Hair Dryer', 'Máy sấy lông chuyên dụng', 580000, 'grooming', 'dog', 'Pet Dryer', 30, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300'),
('Toothbrush and Toothpaste Set', 'Bộ bàn chải và kem đánh răng', 95000, 'grooming', 'dog', 'Pet Dental', 80, (SELECT id FROM profiles LIMIT 1), 'https://via.placeholder.com/300');