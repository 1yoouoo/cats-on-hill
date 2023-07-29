from PIL import Image
import os

# 이미지 파일들이 위치한 디렉토리
img_dir = "/Users/blanc/Documents/Project/cats-on-hill/cats"

# 해당 디렉토리 내의 모든 PNG 파일을 가져옵니다.
imgs = [i for i in os.listdir(img_dir) if i.endswith(".png")]

# 파일 이름을 숫자로 정렬합니다. (예: "1.png", "2.png", ..., "10.png")
imgs = sorted(imgs, key=lambda x: int(os.path.splitext(x)[0]))

# 각각의 이미지를 연다.
img_list = [Image.open(os.path.join(img_dir, img)).convert("RGBA") for img in imgs]

# 각각의 이미지의 너비와 높이를 가져온다.
img_widths, img_heights = zip(*(i.size for i in img_list))

# 전체 이미지의 너비는 각각의 이미지의 너비의 합이고, 높이는 가장 큰 높이와 같다.
total_width = sum(img_widths)
max_height = max(img_heights)

# 새 이미지를 생성한다. (RGBA 모드로 생성하여 배경이 없는 이미지를 만든다)
new_img = Image.new('RGBA', (total_width, max_height))

# 각각의 이미지를 새 이미지에 붙인다.
x_offset = 0
for img in img_list:
    new_img.paste(img, (x_offset,0))
    x_offset += img.width

# 결과 이미지를 저장한다.
new_img.save('combined.png')
