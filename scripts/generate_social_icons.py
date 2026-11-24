import os
from PIL import Image, ImageDraw

out_dir = "public/images/social"
os.makedirs(out_dir, exist_ok=True)
SIZE = (64, 64)

def create_base(bg_color=(30, 41, 59, 255)): # slate-800
    img = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Circle background
    draw.ellipse([4, 4, 60, 60], fill=bg_color)
    return img, draw

# 1. LinkedIn
img, draw = create_base((10, 102, 194, 255)) # LinkedIn blue
# 'in' letters
# 'i' dot
draw.ellipse([21, 18, 25, 22], fill=(255, 255, 255, 255))
# 'i' stem
draw.rectangle([21, 25, 25, 44], fill=(255, 255, 255, 255))
# 'n' stem
draw.rectangle([29, 25, 33, 44], fill=(255, 255, 255, 255))
# 'n' arch & right stem
draw.rectangle([33, 25, 41, 29], fill=(255, 255, 255, 255))
draw.rectangle([39, 27, 43, 44], fill=(255, 255, 255, 255))
img.save(f"{out_dir}/linkedin.png")

# 2. X / Twitter
img, draw = create_base((15, 23, 42, 255)) # sleek black
# X shape lines
draw.line([(19, 19), (45, 45)], fill=(255, 255, 255, 255), width=4)
draw.line([(45, 19), (19, 45)], fill=(255, 255, 255, 255), width=4)
img.save(f"{out_dir}/twitter.png")
img.save(f"{out_dir}/x.png")

# 3. Instagram
img, draw = create_base((225, 48, 108, 255)) # IG pink/red gradient tone
# Rounded camera outline
draw.rounded_rectangle([20, 20, 44, 44], radius=6, outline=(255, 255, 255, 255), width=3)
# Camera lens circle
draw.ellipse([27, 27, 37, 37], outline=(255, 255, 255, 255), width=3)
# Flash dot
draw.ellipse([39, 23, 41, 25], fill=(255, 255, 255, 255))
img.save(f"{out_dir}/instagram.png")

# 4. Facebook
img, draw = create_base((24, 119, 242, 255)) # FB blue
# 'f' letter
draw.rectangle([32, 18, 37, 45], fill=(255, 255, 255, 255))
draw.rectangle([32, 18, 41, 23], fill=(255, 255, 255, 255))
draw.rectangle([27, 27, 42, 32], fill=(255, 255, 255, 255))
img.save(f"{out_dir}/facebook.png")

# 5. Website / Globe
img, draw = create_base((220, 38, 38, 255)) # Dexta Red
# Globe circle
draw.ellipse([19, 19, 45, 45], outline=(255, 255, 255, 255), width=3)
# Horizontal equator
draw.line([(19, 32), (45, 32)], fill=(255, 255, 255, 255), width=2)
# Vertical longitude ellipse
draw.ellipse([26, 19, 38, 45], outline=(255, 255, 255, 255), width=2)
img.save(f"{out_dir}/website.png")

# 6. Also create subtle monochrome / dark variants for minimal theme
mono_dir = f"{out_dir}/mono"
os.makedirs(mono_dir, exist_ok=True)
for name, color in [("linkedin", (10, 102, 194)), ("twitter", (15, 23, 42)), ("instagram", (225, 48, 108)), ("facebook", (24, 119, 242)), ("website", (220, 38, 38))]:
    src = Image.open(f"{out_dir}/{name}.png")
    src.save(f"{mono_dir}/{name}.png")

print("Social icons generated successfully in", out_dir)
