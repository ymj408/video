INSERT INTO app_user (id, display_name, email, avatar_color, plan_name, credits) VALUES
('usr_junpeng', 'Junpeng Lin', 'junpeng@luma.demo', '#B8ED4B', 'Studio Pro', 5000),
('usr_mia', 'Mia Chen', 'mia@luma.demo', '#E4A17E', 'Creator', 2400),
('usr_demo', 'Demo Visitor', 'visitor@luma.demo', '#8BA9E3', 'Starter', 600);

INSERT INTO template_category (slug, label, sort_order) VALUES
('pets', '宠物', 10),
('wedding', '婚礼', 20),
('holiday', '节日', 30),
('creative', '创意', 40),
('scenery', '风景', 50),
('portrait', '人像', 60);

INSERT INTO creation_template
(id, title, category_slug, description, cover_url, target_result_url, required_image_count, accepted_mime_types, max_file_size_bytes, featured, sort_order)
VALUES
('pet-sticker', '毛球贴纸', 'pets',
 '把宠物的可爱瞬间做成一张带手作感的纪念贴纸。后台会完成素材检查、画面生成与成品整理。',
 '/media/templates/pet-sticker.jpg', '/media/results/pet-sticker.jpg', 1, 'image/jpeg,image/png', 5242880, TRUE, 10),

('pet-editorial', '午后猫片', 'pets',
 '暖调室内摄影风格，记录猫咪最松弛的一刻。适合两张同场景照片拼贴。',
 '/media/templates/pet-editorial.jpg', '/media/results/pet-editorial.jpg', 2, 'image/jpeg,image/png', 5242880, FALSE, 20),

('wedding-film', '暮光婚礼', 'wedding',
 '电影感黑白婚礼画面，以双人合照为素材，做成一帧有颗粒与月光的纪念海报。',
 '/media/templates/wedding-film.jpg', '/media/results/wedding-film.jpg', 2, 'image/jpeg,image/png', 5242880, TRUE, 30),

('wedding-garden', '花园请柬', 'wedding',
 '花园、丝带与手写气息构成的婚礼请柬。上传三张照片，组合成一份可预览的电子请柬。',
 '/media/templates/wedding-garden.jpg', '/media/results/wedding-garden.jpg', 3, 'image/jpeg,image/png', 5242880, FALSE, 40),

('holiday-santa', '圣诞礼物', 'holiday',
 '红绿节日配色和童话式构图，给家人合照加一层圣诞滤镜。',
 '/media/templates/holiday-santa.jpg', '/media/results/holiday-santa.jpg', 2, 'image/jpeg,image/png', 5242880, TRUE, 50),

('holiday-lights', '冬夜灯串', 'holiday',
 '深蓝夜色与暖色光斑，适合把一张照片做成一封安静的节日问候。',
 '/media/templates/holiday-lights.jpg', '/media/results/holiday-lights.jpg', 1, 'image/jpeg,image/png', 5242880, FALSE, 60),

('travel-postcard', '海岸明信片', 'creative',
 '把两张旅拍拼成一张有呼吸感的明信片。海浪、沙粒和盐味留白都由模板完成。',
 '/media/templates/travel-postcard.jpg', '/media/results/travel-postcard.jpg', 2, 'image/jpeg,image/png', 5242880, TRUE, 70),

('product-editorial', '静物编辑', 'creative',
 '杂志感静物构图，适合器物、餐食与产品照片。单人素材即可完成一页编辑图。',
 '/media/templates/product-editorial.jpg', '/media/results/product-editorial.jpg', 1, 'image/jpeg,image/png', 5242880, FALSE, 80),

('city-weekend', '城市周末', 'scenery',
 '黄昏天际线海报，把你的城市照片做成一张周末封面。支持两张不同视角。',
 '/media/templates/city-weekend.jpg', '/media/results/city-weekend.jpg', 2, 'image/jpeg,image/png', 5242880, TRUE, 90),

('mountain-escape', '山野逃离', 'scenery',
 '低饱和山野配色与徒步剪影，适合双人旅行记录。两张素材会组成上下景深。',
 '/media/templates/mountain-escape.jpg', '/media/results/mountain-escape.jpg', 2, 'image/jpeg,image/png', 5242880, FALSE, 100),

('snow-portrait', '冰晶肖像', 'portrait',
 '冷冽冰蓝与冠冕元素，把一张单人照做成冬日人像海报。',
 '/media/templates/snow-portrait.jpg', '/media/results/snow-portrait.jpg', 1, 'image/jpeg,image/png', 5242880, TRUE, 110),

('studio-portrait', '柔光人像', 'portrait',
 '柔焦影棚风与暖色光线，适合单人肖像、生日卡片或个人主页封面。',
 '/media/templates/studio-portrait.jpg', '/media/results/studio-portrait.jpg', 1, 'image/jpeg,image/png', 5242880, FALSE, 120);
