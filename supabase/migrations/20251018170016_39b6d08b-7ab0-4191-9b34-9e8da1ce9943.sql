-- Grant seller role to lazybeo user
INSERT INTO user_roles (user_id, role)
VALUES ('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'seller')
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix storage policies for pet-images bucket to allow simpler path structure
DROP POLICY IF EXISTS "Users can upload pet images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update pet images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete pet images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pet images" ON storage.objects;

-- Create simpler policies that work with the current upload path structure
CREATE POLICY "Anyone can view pet images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-images');

CREATE POLICY "Authenticated users can upload pet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pet-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update pet images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pet-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete pet images"
ON storage.objects FOR DELETE
USING (bucket_id = 'pet-images' AND auth.role() = 'authenticated');

-- Add 10 popular dog and cat food products
INSERT INTO products (seller_id, name, description, price, category, pet_type, stock, is_active, brand) VALUES
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Royal Canin Medium Adult', 'Thức ăn cho chó trưởng thành giống vừa, giàu protein và chất xơ giúp tiêu hóa tốt', 450000, 'food', 'dog', 50, true, 'Royal Canin'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Pedigree Vị Gà & Rau Củ', 'Thức ăn khô cho chó trưởng thành với vị gà thơm ngon, bổ sung vitamin và khoáng chất', 280000, 'food', 'dog', 100, true, 'Pedigree'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Me-O Persian Adult', 'Thức ăn cho mèo Ba Tư trưởng thành, giảm búi lông, tốt cho da và lông', 320000, 'food', 'cat', 75, true, 'Me-O'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Whiskas Vị Cá Biển', 'Thức ăn ướt cho mèo với hương vị cá biển tươi ngon, bổ sung taurine', 180000, 'food', 'cat', 120, true, 'Whiskas'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Ganador Puppy', 'Thức ăn cho chó con, giàu DHA giúp phát triển não bộ và thị lực', 380000, 'food', 'dog', 60, true, 'Ganador'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Smartheart Kitten', 'Thức ăn cho mèo con dưới 1 tuổi, công thức dinh dưỡng cân đối', 250000, 'food', 'cat', 80, true, 'Smartheart'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Reflex Plus Adult Dog Chicken', 'Thức ăn cho chó trưởng thành với thịt gà tươi, không chứa gluten', 520000, 'food', 'dog', 40, true, 'Reflex Plus'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Minino Yum Tuna', 'Thức ăn cho mèo vị cá ngừ, giàu omega-3 và omega-6', 210000, 'food', 'cat', 90, true, 'Minino'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Kitekat Vị Cá Thu', 'Thức ăn cho mèo trưởng thành, công thức chăm sóc hệ tiết niệu', 195000, 'food', 'cat', 110, true, 'Kitekat'),
('37492f49-9afe-4085-a0fe-75cce73c9e6b', 'Nutri Source Senior & Weight', 'Thức ăn cho chó cao tuổi và kiểm soát cân nặng, ít calo', 580000, 'food', 'dog', 35, true, 'Nutri Source');