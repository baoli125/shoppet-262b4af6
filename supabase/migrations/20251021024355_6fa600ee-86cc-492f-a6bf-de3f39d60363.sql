-- Update last product image
UPDATE products SET image_url = '/products/toothbrush-and-toothpaste-set.jpg' WHERE id = '47a3e652-a7a3-4a1c-a176-eab6217ac9cd';

-- Add detailed product information fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS nutritional_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS usage_instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT;