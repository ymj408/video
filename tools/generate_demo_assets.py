"""Generate all demo covers and result previews without external services.

The artwork is procedurally drawn with Pillow. It intentionally uses abstract
silhouettes and studio-style lighting instead of stock photography so the
project has no third-party asset or licensing dependency.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
COVER_DIR = ROOT / "backend" / "src" / "main" / "resources" / "static" / "media" / "templates"
RESULT_DIR = ROOT / "backend" / "src" / "main" / "resources" / "static" / "media" / "results"

FONT_DIR = Path("C:/Windows/Fonts")
SERIF = FONT_DIR / "georgia.ttf"
SERIF_ITALIC = FONT_DIR / "georgiai.ttf"
SANS = FONT_DIR / "seguisb.ttf"
SANS_REGULAR = FONT_DIR / "segoeui.ttf"
SANS_BOLD = FONT_DIR / "seguibl.ttf"
MONO = FONT_DIR / "consola.ttf"

W, H = 1200, 1600
SEED = 9471


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = hex_color.lstrip("#")
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), alpha)


def gradient(size: tuple[int, int], top: str, bottom: str, angle: float = 0.0) -> Image.Image:
    width, height = size
    image = Image.new("RGB", size)
    pixels = image.load()
    top_rgb, bottom_rgb = rgba(top)[:3], rgba(bottom)[:3]
    rad = math.radians(angle)
    dx, dy = math.sin(rad), math.cos(rad)
    span = abs(dx) * width + abs(dy) * height
    offset = (abs(dx) * width + abs(dy) * height) / 2 if dx * dy else 0
    for y in range(height):
        for x in range(width):
            t = ((x - width / 2) * dx + (y - height / 2) * dy) / max(span, 1) + 0.5
            t = max(0.0, min(1.0, t))
            pixels[x, y] = tuple(
                round(top_rgb[i] + (bottom_rgb[i] - top_rgb[i]) * t) for i in range(3)
            )
    if offset:
        pass
    return image


def radial_glow(image: Image.Image, center: tuple[float, float], radius: float, color: str, alpha: int) -> None:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    cx, cy = center
    steps = 26
    for i in range(steps, 0, -1):
        r = radius * i / steps
        a = int(alpha * (1 - i / steps) ** 1.7)
        draw.ellipse((cx - r, cy - r * 0.9, cx + r, cy + r * 0.9), fill=rgba(color, a))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius * 0.08))
    image.alpha_composite(overlay)


def bokeh(image: Image.Image, rng: random.Random, count: int, colors: list[str], area=(0, 0, 1, 1)) -> None:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = image.size
    x0, y0, x1, y1 = area
    for _ in range(count):
        r = rng.uniform(6, 56)
        x = rng.uniform(x0 * w, x1 * w)
        y = rng.uniform(y0 * h, y1 * h)
        color = rng.choice(colors)
        alpha = rng.randint(20, 104)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba(color, alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(7))
    image.alpha_composite(overlay)


def grain(image: Image.Image, rng: random.Random, strength: int = 13) -> None:
    noise = Image.effect_noise(image.size, strength).convert("L")
    noise_rgb = Image.merge("RGBA", (noise, noise, noise, Image.new("L", image.size, 20)))
    image.alpha_composite(noise_rgb)


def vignette(image: Image.Image, opacity: int = 110) -> None:
    width, height = image.size
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((-width * 0.18, -height * 0.22, width * 1.18, height * 1.22), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(width * 0.14))
    shade = Image.new("RGBA", image.size, (0, 0, 0, opacity))
    inverse = Image.eval(mask, lambda v: 255 - v)
    shade.putalpha(inverse)
    image.alpha_composite(shade)


def paste_text(
    image: Image.Image,
    text: str,
    xy: tuple[int, int],
    font: ImageFont.FreeTypeFont,
    fill: str,
    anchor: str = "la",
    spacing: int = 10,
    align: str = "left",
) -> None:
    draw = ImageDraw.Draw(image)
    draw.multiline_text(
        xy, text, font=font, fill=rgba(fill), anchor=anchor, spacing=spacing, align=align
    )


def soft_shadow(image: Image.Image, box: tuple[int, int, int, int], blur: int = 32, alpha: int = 90) -> None:
    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow)
    d.rounded_rectangle(box, radius=36, fill=(0, 0, 0, alpha))
    image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(blur)))


def draw_sparkle(draw: ImageDraw.ImageDraw, x: float, y: float, r: float, color: str, alpha=255) -> None:
    draw.line((x - r, y, x + r, y), fill=rgba(color, alpha), width=max(1, int(r * 0.16)))
    draw.line((x, y - r, x, y + r), fill=rgba(color, alpha), width=max(1, int(r * 0.16)))
    d = r * 0.34
    draw.line((x - d, y - d, x + d, y + d), fill=rgba(color, alpha // 2), width=1)
    draw.line((x - d, y + d, x + d, y - d), fill=rgba(color, alpha // 2), width=1)


def fur_ellipse(draw, box, color, rng, count=42, alpha=240):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
    draw.ellipse(box, fill=rgba(color, alpha))
    for _ in range(count):
        angle = rng.uniform(0, math.tau)
        px = cx + math.cos(angle) * rx * rng.uniform(0.84, 1.04)
        py = cy + math.sin(angle) * ry * rng.uniform(0.84, 1.04)
        rr = rng.uniform(18, 50)
        draw.ellipse((px - rr, py - rr, px + rr, py + rr), fill=rgba(color, rng.randint(140, 235)))


def cover_pet_sticker() -> Image.Image:
    rng = random.Random(SEED + 1)
    image = gradient((W, H), "#d6c9ac", "#6f7352", 18).convert("RGBA")
    radial_glow(image, (840, 390), 540, "#fff6d9", 150)
    bokeh(image, rng, 30, ["#fff7e0", "#b9b58c", "#ece0b5"])
    # Soft backdrop panel
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rounded_rectangle((96, 180, 1104, 1440), 70, fill=rgba("#efe7d1", 165))
    d.rounded_rectangle((128, 212, 1072, 1408), 55, outline=rgba("#f9f3e4", 80), width=2)
    image.alpha_composite(overlay)
    # Dog
    d = ImageDraw.Draw(image, "RGBA")
    fur_ellipse(d, (286, 412, 920, 1110), "#f7f3e8", rng, count=74)
    d.ellipse((255, 550, 445, 820), fill=rgba("#f3eddf", 245))
    d.ellipse((760, 538, 956, 816), fill=rgba("#f1ebdc", 245))
    # facial fluff
    for _ in range(36):
        x = rng.uniform(360, 850)
        y = rng.uniform(640, 1030)
        r = rng.uniform(22, 52)
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgba("#faf6ec", 190))
    # eyes and nose
    d.ellipse((462, 706, 534, 780), fill=rgba("#171613", 255))
    d.ellipse((694, 706, 766, 780), fill=rgba("#171613", 255))
    d.ellipse((486, 723, 504, 743), fill=rgba("#ffffff", 255))
    d.ellipse((718, 723, 736, 743), fill=rgba("#ffffff", 255))
    d.ellipse((580, 820, 646, 872), fill=rgba("#252019", 255))
    d.arc((560, 860, 670, 952), 8, 172, fill=rgba("#2f2822", 255), width=10)
    d.ellipse((590, 905, 640, 952), fill=rgba("#e88d97", 255))
    # bandana
    d.polygon([(410, 1040), (804, 1030), (735, 1248), (494, 1258)], fill=rgba("#9fb5c4", 255))
    d.polygon([(410, 1040), (804, 1030), (770, 1090), (443, 1098)], fill=rgba("#c6d5dd", 255))
    for x in range(440, 800, 56):
        d.line((x, 1090, x - 30, 1245), fill=rgba("#7e9aa9", 150), width=3)
    for y in range(1120, 1240, 42):
        d.line((440, y, 780, y - 8), fill=rgba("#7e9aa9", 130), width=2)
    for x, y in [(500, 1180), (620, 1195), (700, 1155), (550, 1135)]:
        d.ellipse((x - 22, y - 18, x + 22, y + 18), fill=rgba("#b74c4a", 225))
        d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=rgba("#e2a15a", 255))
        d.ellipse((x - 28, y, x - 8, y + 12), fill=rgba("#6b7e4d", 230))
    for x, y, r in [(196, 340, 26), (1040, 320, 18), (184, 1220, 14), (1000, 1300, 24), (720, 300, 12)]:
        draw_sparkle(d, x, y, r, "#f8efcf", 210)
    paste_text(image, "SOFT COMPANION", (118, 1442), ImageFont.truetype(str(SANS), 30), "#f6f2e8")
    paste_text(image, "01 / PET SERIES", (118, 1490), ImageFont.truetype(str(MONO), 22), "#e3ddcd")
    grain(image, rng, 9)
    vignette(image, 95)
    return image.convert("RGB")


def cover_pet_editorial() -> Image.Image:
    rng = random.Random(SEED + 2)
    image = gradient((W, H), "#eadbc5", "#8b7c6b", 28).convert("RGBA")
    radial_glow(image, (320, 330), 600, "#fff9e9", 190)
    # Window light
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rectangle((0, 0, 450, 1220), fill=rgba("#fff6e3", 82))
    d.line((452, 0, 452, 1220), fill=rgba("#f8eedb", 150), width=4)
    d.line((0, 420, 452, 420), fill=rgba("#f8eedb", 100), width=3)
    image.alpha_composite(overlay)
    bokeh(image, rng, 28, ["#fff4dc", "#c8b49b"], area=(0, 0, 1, 0.6))
    d = ImageDraw.Draw(image, "RGBA")
    # low table
    d.rectangle((0, 1230, W, H), fill=rgba("#6f5c4b", 255))
    d.ellipse((0, 1150, W, 1360), fill=rgba("#a18a6f", 160))
    # Cat body silhouette
    d.ellipse((586, 726, 1046, 1230), fill=rgba("#f4eee3", 255))
    d.ellipse((670, 640, 956, 1006), fill=rgba("#f7f2e8", 255))
    d.polygon([(700, 700), (720, 552), (806, 660)], fill=rgba("#f1eadf", 255))
    d.polygon([(842, 648), (912, 536), (934, 696)], fill=rgba("#f1eadf", 255))
    for eye_x in (775, 866):
        d.arc((eye_x - 18, 760, eye_x + 18, 790), 190, 350, fill=rgba("#2b2b2b", 255), width=6)
    d.polygon([(816, 800), (837, 800), (827, 812)], fill=rgba("#c98c8a", 255))
    # Bowl and food
    d.ellipse((420, 1110, 780, 1240), fill=rgba("#d8c9b1", 255))
    d.ellipse((446, 1088, 754, 1170), fill=rgba("#7a5b3f", 255))
    for _ in range(75):
        x = rng.uniform(476, 724)
        y = rng.uniform(1076, 1134)
        d.ellipse((x - 9, y - 7, x + 9, y + 7), fill=rgba(rng.choice(["#b68a5b", "#90633e", "#d8b47b"]), 255))
    d.arc((420, 1090, 780, 1310), 0, 180, fill=rgba("#efe4d2", 255), width=20)
    # foreground leaves
    for x, y, rr in [(100, 1330, 130), (1080, 1370, 210), (990, 1280, 120)]:
        d.ellipse((x - rr, y - rr * 0.45, x + rr, y + rr * 0.45), fill=rgba("#5a664b", 150))
    paste_text(image, "SLOW AFTERNOON", (110, 1436), ImageFont.truetype(str(SERIF), 54), "#f8f1e5")
    paste_text(image, "AN EVERYDAY STUDY", (116, 1508), ImageFont.truetype(str(MONO), 22), "#e8decd")
    grain(image, rng, 8)
    vignette(image, 115)
    return image.convert("RGB")


def cover_wedding_film() -> Image.Image:
    rng = random.Random(SEED + 3)
    image = gradient((W, H), "#161d2a", "#050609", 15).convert("RGBA")
    radial_glow(image, (600, 620), 620, "#dbe7ff", 105)
    bokeh(image, rng, 100, ["#f4f6ff", "#bdcce7", "#ffffff"], area=(0, 0, 1, 1))
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    # moon halo
    d.ellipse((422, 188, 840, 630), fill=rgba("#e8edf5", 26))
    d.ellipse((468, 232, 790, 576), fill=rgba("#eef2f8", 48))
    image.alpha_composite(overlay)
    d = ImageDraw.Draw(image, "RGBA")
    # groom silhouette
    d.ellipse((500, 758, 590, 858), fill=rgba("#0b0d11", 255))
    d.polygon([(464, 980), (612, 980), (646, 1405), (422, 1405)], fill=rgba("#0b0d11", 255))
    d.polygon([(488, 860), (542, 860), (610, 990), (488, 1015)], fill=rgba("#12151b", 255))
    # bride silhouette with bright dress
    d.ellipse((624, 704, 716, 808), fill=rgba("#171a20", 255))
    d.polygon([(662, 786), (744, 790), (760, 910), (674, 920)], fill=rgba("#f1f0eb", 240))
    d.polygon([(674, 900), (760, 890), (950, 1410), (518, 1410), (626, 914)], fill=rgba("#edece7", 235))
    # veil
    veil = Image.new("RGBA", image.size, (0, 0, 0, 0))
    vd = ImageDraw.Draw(veil)
    vd.polygon([(690, 760), (910, 1010), (864, 1404), (606, 1404), (636, 934)], fill=rgba("#f5f4ef", 50))
    image.alpha_composite(veil.filter(ImageFilter.GaussianBlur(14)))
    # hands / bouquet
    d.ellipse((668, 982, 726, 1028), fill=rgba("#8b7667", 255))
    for x, y, rr in [(624, 1010, 30), (700, 1038, 26), (646, 1070, 34)]:
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=rgba("#c8cbd1", 220))
        d.ellipse((x - rr * 0.4, y - rr * 0.4, x + rr * 0.4, y + rr * 0.4), fill=rgba("#f4f3ed", 230))
    # foreground
    d.polygon([(0, 1430), (700, 1250), (1200, 1510), (1200, 1600), (0, 1600)], fill=rgba("#020304", 255))
    for x, y, r in [(224, 366, 20), (1006, 448, 26), (862, 280, 10), (334, 660, 12), (960, 792, 16)]:
        draw_sparkle(d, x, y, r, "#f2f4fa", 185)
    paste_text(image, "DUSK VOWS", (100, 1438), ImageFont.truetype(str(SERIF_ITALIC), 64), "#f0f1f4")
    paste_text(image, "A FILM IN TWO FRAMES", (104, 1524), ImageFont.truetype(str(MONO), 22), "#b8c0cf")
    grain(image, rng, 15)
    vignette(image, 150)
    return image.convert("RGB")


def cover_wedding_garden() -> Image.Image:
    rng = random.Random(SEED + 4)
    image = gradient((W, H), "#f3e8df", "#cdb8ac", 4).convert("RGBA")
    radial_glow(image, (650, 480), 600, "#fff8eb", 175)
    bokeh(image, rng, 38, ["#fffaf0", "#dfc8ba"], area=(0, 0, 1, 0.75))
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    # arch
    d.arc((170, 250, 1030, 1530), 180, 360, fill=rgba("#7b6e59", 170), width=12)
    d.ellipse((408, 322, 792, 706), fill=rgba("#fff8ed", 108))
    d.rounded_rectangle((282, 520, 918, 1448), 300, outline=rgba("#fdf7e9", 95), width=3)
    image.alpha_composite(overlay)
    d = ImageDraw.Draw(image, "RGBA")
    # simple intertwined rings
    d.ellipse((502, 596, 690, 784), outline=rgba("#736858", 220), width=12)
    d.ellipse((610, 620, 798, 808), outline=rgba("#8b7a62", 220), width=12)
    # florals around arch
    for side in (0, 1):
        base_x = 150 if side == 0 else 1050
        for i in range(26):
            x = base_x + rng.uniform(-100, 100) + (i * (12 if side == 0 else -12))
            y = 720 + i * 28 + rng.uniform(-32, 32)
            r = rng.uniform(15, 48)
            col = rng.choice(["#f7f0e4", "#d9c4af", "#ab9b86", "#8a9a7a", "#c6a7a0"])
            d.ellipse((x - r, y - r, x + r, y + r), fill=rgba(col, rng.randint(160, 240)))
            if rng.random() > 0.5:
                d.ellipse((x - r * 0.3, y - r * 0.3, x + r * 0.3, y + r * 0.3), fill=rgba("#f9f4ea", 220))
    # ribbon
    d.polygon([(500, 1090), (700, 1090), (690, 1460), (610, 1390), (530, 1460)], fill=rgba("#d9b8ae", 230))
    paste_text(image, "GARDEN VOWS", (600, 1322), ImageFont.truetype(str(SERIF), 46), "#5f584e", anchor="ma")
    paste_text(image, "INVITATION NO. 03", (600, 1390), ImageFont.truetype(str(MONO), 20), "#786d5e", anchor="ma")
    grain(image, rng, 9)
    vignette(image, 85)
    return image.convert("RGB")


def cover_holiday_santa() -> Image.Image:
    rng = random.Random(SEED + 5)
    image = gradient((W, H), "#3c1117", "#08120e", 24).convert("RGBA")
    radial_glow(image, (730, 530), 620, "#dca24b", 120)
    bokeh(image, rng, 95, ["#ffd37a", "#e7bf76", "#9ab38e"], area=(0, 0, 1, 0.75))
    # tree branches / baubles
    d = ImageDraw.Draw(image, "RGBA")
    for x, y in [(90, 160), (1080, 240), (180, 1130), (1020, 980), (900, 1190)]:
        r = rng.uniform(48, 90)
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgba("#0b1b15", 235))
        d.ellipse((x - r * 0.5, y - r * 0.5, x + r * 0.3, y + r * 0.2), fill=rgba("#a62832", 210))
    # Santa torso
    d.ellipse((426, 480, 892, 950), fill=rgba("#f4e7d5", 255))
    d.ellipse((360, 596, 572, 796), fill=rgba("#f8eee0", 255))
    d.ellipse((748, 596, 962, 796), fill=rgba("#f8eee0", 255))
    d.polygon([(560, 860), (920, 900), (1000, 1600), (360, 1600), (430, 900)], fill=rgba("#a92d34", 255))
    d.polygon([(548, 850), (920, 890), (1000, 1600), (360, 1600), (430, 900)], outline=rgba("#d5a65c", 130), width=4)
    d.rectangle((330, 1000, 1030, 1080), fill=rgba("#f3e8d8", 255))
    d.rounded_rectangle((552, 1010, 650, 1120), 18, fill=rgba("#d4a14e", 230))
    # face
    d.ellipse((544, 646, 806, 890), fill=rgba("#e9c4a2", 255))
    for x in (606, 734):
        d.ellipse((x - 16, 738, x + 16, 770), fill=rgba("#1b1713", 255))
    d.ellipse((624, 800, 722, 858), fill=rgba("#f2e3d1", 255))
    d.arc((610, 760, 752, 840), 15, 165, fill=rgba("#8f6652", 255), width=5)
    # hat
    d.polygon([(512, 636), (796, 620), (946, 280), (892, 260), (730, 480)], fill=rgba("#b42e35", 255))
    d.ellipse((896, 218, 1002, 316), fill=rgba("#f8eee2", 255))
    d.ellipse((486, 598, 830, 690), fill=rgba("#faf2e6", 255))
    # child silhouette
    d.ellipse((176, 1008, 296, 1130), fill=rgba("#3c281e", 255))
    d.polygon([(158, 1118), (316, 1118), (372, 1470), (100, 1470)], fill=rgba("#485743", 255))
    d.polygon([(176, 1180), (300, 1180), (320, 1410), (152, 1410)], fill=rgba("#6c5a42", 245))
    # gift
    d.rectangle((154, 1260, 364, 1450), fill=rgba("#c2ae8a", 255))
    d.rectangle((238, 1260, 278, 1450), fill=rgba("#8d292d", 230))
    d.rectangle((154, 1322, 364, 1360), fill=rgba("#8d292d", 230))
    paste_text(image, "A LITTLE WONDER", (88, 1440), ImageFont.truetype(str(SERIF), 44), "#f7ead8")
    paste_text(image, "HOLIDAY EDITION / 24", (92, 1510), ImageFont.truetype(str(MONO), 21), "#c8bca8")
    grain(image, rng, 12)
    vignette(image, 140)
    return image.convert("RGB")


def cover_holiday_lights() -> Image.Image:
    rng = random.Random(SEED + 6)
    image = gradient((W, H), "#071623", "#0c2930", 18).convert("RGBA")
    bokeh(image, rng, 140, ["#ffbf63", "#ffe0a1", "#77a8a0"], area=(0, 0, 1, 1))
    d = ImageDraw.Draw(image, "RGBA")
    # string light sweeping across
    points = [(i, 350 + 120 * math.sin(i / 170) + i * 0.1) for i in range(-80, W + 80, 16)]
    d.line(points, fill=rgba("#1b2a2d", 255), width=3)
    for i, (x, y) in enumerate(points[::4]):
        r = 8 if i % 3 else 11
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgba("#ffe4a5", 245))
        glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse((x - 34, y - 34, x + 34, y + 34), fill=rgba("#ffc96f", 50))
        image.alpha_composite(glow.filter(ImageFilter.GaussianBlur(14)))
    # snowy foreground
    d = ImageDraw.Draw(image, "RGBA")
    d.polygon([(0, 1220), (260, 1120), (520, 1210), (830, 1090), (1200, 1230), (1200, 1600), (0, 1600)], fill=rgba("#dbe6e7", 235))
    d.polygon([(0, 1300), (330, 1190), (690, 1320), (1000, 1200), (1200, 1310), (1200, 1600), (0, 1600)], fill=rgba("#b7cdd1", 190))
    # tiny cabin
    d.rectangle((760, 1010, 1040, 1240), fill=rgba("#2d2520", 255))
    d.polygon([(720, 1010), (900, 880), (1080, 1010)], fill=rgba("#e7dfd2", 255))
    d.rectangle((850, 1100, 930, 1180), fill=rgba("#f4c66c", 220))
    d.rectangle((790, 1090, 830, 1140), fill=rgba("#ffcf75", 210))
    # tree silhouettes
    for x, scale in [(190, 1.0), (470, 0.66), (1120, 0.9)]:
        d.rectangle((x - 14, 1160, x + 14, 1420), fill=rgba("#193329", 255))
        for layer in range(3):
            w = (280 - layer * 50) * scale
            top = 900 + layer * 150
            d.polygon([(x, top), (x - w, top + 330), (x + w, top + 330)], fill=rgba("#123227", 255))
    for x, y, r in [(312, 620, 22), (842, 530, 15), (1080, 690, 28), (226, 860, 14)]:
        draw_sparkle(d, x, y, r, "#f9edd4", 170)
    paste_text(image, "WINTER LIGHTS", (100, 1434), ImageFont.truetype(str(SERIF), 56), "#f5f0e5")
    paste_text(image, "A QUIET CELEBRATION", (104, 1518), ImageFont.truetype(str(MONO), 21), "#aec5c6")
    grain(image, rng, 11)
    vignette(image, 130)
    return image.convert("RGB")


def cover_coastal() -> Image.Image:
    rng = random.Random(SEED + 7)
    image = gradient((W, H), "#2b95d0", "#acdce0", 3).convert("RGBA")
    radial_glow(image, (790, 380), 480, "#fff6d5", 150)
    bokeh(image, rng, 26, ["#ffffff", "#e6f7ff"], area=(0, 0, 1, 0.45))
    d = ImageDraw.Draw(image, "RGBA")
    # clouds
    for (cx, cy, s) in [(250, 300, 1.0), (830, 250, 0.7), (1000, 470, 0.5)]:
        for dx, dy, rx, ry in [(0, 0, 190, 60), (110, -18, 130, 50), (-100, 14, 120, 44)]:
            d.ellipse((cx + dx * s - rx * s, cy + dy * s - ry * s, cx + dx * s + rx * s, cy + dy * s + ry * s), fill=rgba("#fffdf3", 120))
    # sea bands
    d.rectangle((0, 570, W, 1180), fill=rgba("#1c7f9d", 255))
    for i, y in enumerate(range(620, 1200, 50)):
        d.line((0, y, W, y - 20), fill=rgba("#a9e3e6", 45 + i * 4), width=4)
        d.line((0, y + 17, W, y - 3), fill=rgba("#0d5675", 30), width=2)
    # island
    d.ellipse((760, 680, 1120, 790), fill=rgba("#32594d", 255))
    d.ellipse((820, 640, 980, 740), fill=rgba("#4e725b", 255))
    # sand
    d.polygon([(0, 1180), (1200, 1080), (1200, 1600), (0, 1600)], fill=rgba("#eadcc0", 255))
    d.polygon([(0, 1180), (1200, 1080), (1200, 1160), (0, 1290)], fill=rgba("#f5ecd9", 255))
    for _ in range(220):
        x = rng.uniform(0, W)
        y = rng.uniform(1200, 1600)
        d.ellipse((x, y, x + 4, y + 3), fill=rgba("#d2c0a1", 120))
    # palms left
    d.line((170, 1300, 236, 720), fill=rgba("#4c4a36", 255), width=24)
    for angle in range(-150, 30, 30):
        ex = 236 + math.cos(math.radians(angle)) * 250
        ey = 720 + math.sin(math.radians(angle)) * 180
        d.line((236, 720, ex, ey), fill=rgba("#3c5d41", 255), width=14)
        for t in (0.5, 0.8):
            px, py = 236 + (ex - 236) * t, 720 + (ey - 720) * t
            d.ellipse((px - 24, py - 10, px + 24, py + 10), fill=rgba("#5e7c51", 200), outline=rgba("#39523a", 200))
    # postcard frame
    frame = Image.new("RGBA", image.size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rectangle((56, 56, W - 56, H - 56), outline=rgba("#fbf8ee", 100), width=2)
    image.alpha_composite(frame)
    paste_text(image, "COASTAL POSTCARD", (100, 1418), ImageFont.truetype(str(SERIF), 56), "#243934")
    paste_text(image, "SALT / SUN / SLOW", (104, 1506), ImageFont.truetype(str(MONO), 22), "#334a44")
    grain(image, rng, 7)
    vignette(image, 80)
    return image.convert("RGB")


def cover_product() -> Image.Image:
    rng = random.Random(SEED + 8)
    image = gradient((W, H), "#86856c", "#282b23", 28).convert("RGBA")
    radial_glow(image, (420, 390), 620, "#e5dfc3", 160)
    bokeh(image, rng, 25, ["#d7d1b2", "#aba78c"], area=(0, 0, 1, 0.7))
    d = ImageDraw.Draw(image, "RGBA")
    # table
    d.rectangle((0, 1030, W, H), fill=rgba("#34352c", 255))
    d.ellipse((0, 970, W, 1200), fill=rgba("#6a6956", 170))
    # ceramic bowl
    d.ellipse((354, 1014, 874, 1280), fill=rgba("#d6cbb2", 255))
    d.ellipse((394, 992, 834, 1112), fill=rgba("#5f4b38", 255))
    for _ in range(150):
        x = rng.uniform(426, 802)
        y = rng.uniform(978, 1074)
        rr = rng.uniform(7, 14)
        d.ellipse((x - rr, y - rr * 0.7, x + rr, y + rr * 0.7), fill=rgba(rng.choice(["#b48b5b", "#8a6844", "#d8b982"]), 255))
    d.arc((354, 1000, 874, 1270), 0, 180, fill=rgba("#eee5d3", 200), width=22)
    # cat peeking in, abstract
    d.ellipse((690, 748, 1080, 1120), fill=rgba("#e5ded1", 255))
    d.ellipse((746, 646, 1020, 934), fill=rgba("#eee8dd", 255))
    d.polygon([(782, 710), (798, 568), (864, 672)], fill=rgba("#e7dfd3", 255))
    d.polygon([(918, 660), (984, 560), (1000, 704)], fill=rgba("#e7dfd3", 255))
    for x in (842, 932):
        d.arc((x - 17, 748, x + 17, 782), 190, 350, fill=rgba("#3a3832", 255), width=6)
    d.polygon([(884, 800), (906, 800), (895, 814)], fill=rgba("#be8b88", 255))
    # shadows and vase
    d.ellipse((204, 1100, 412, 1180), fill=rgba("#1e201a", 90))
    d.rounded_rectangle((148, 830, 316, 1140), 70, fill=rgba("#3b3f32", 240))
    for y in range(880, 1100, 34):
        d.line((168, y, 296, y - 20), fill=rgba("#7f816c", 80), width=2)
    # dried branch
    d.line((230, 840, 380, 520), fill=rgba("#453f2f", 255), width=6)
    for t in (0.3, 0.55, 0.78):
        bx, by = 230 + (380 - 230) * t, 840 + (520 - 840) * t
        d.line((bx, by, bx + 64, by - 118), fill=rgba("#514832", 255), width=3)
        d.ellipse((bx + 44, by - 142, bx + 90, by - 98), fill=rgba("#777254", 200))
    paste_text(image, "STILL LIFE / 07", (100, 1436), ImageFont.truetype(str(SERIF), 52), "#f0eadc")
    paste_text(image, "OBJECTS WITH QUIET COMPANY", (104, 1514), ImageFont.truetype(str(MONO), 20), "#d0c9b7")
    grain(image, rng, 10)
    vignette(image, 130)
    return image.convert("RGB")


def cover_city() -> Image.Image:
    rng = random.Random(SEED + 9)
    image = gradient((W, H), "#45466f", "#d28a7d", 8).convert("RGBA")
    radial_glow(image, (900, 470), 380, "#f6c091", 185)
    d = ImageDraw.Draw(image, "RGBA")
    # skyline
    x = -20
    while x < W + 40:
        w = rng.randint(46, 120)
        h = rng.randint(200, 620)
        y = 980 - h
        d.rectangle((x, y, x + w, 1090), fill=rgba("#242638", 255))
        if rng.random() > 0.4:
            for wx in range(x + 12, x + w - 8, 22):
                for wy in range(y + 22, 1030, 38):
                    if rng.random() > 0.6:
                        d.rectangle((wx, wy, wx + 6, wy + 10), fill=rgba("#f4c175", rng.randint(70, 180)))
        x += w + rng.randint(0, 18)
    # tower-ish landmark
    d.line((760, 1000, 760, 640), fill=rgba("#1b1c2b", 255), width=12)
    d.ellipse((710, 610, 810, 710), outline=rgba("#1b1c2b", 255), width=10)
    d.ellipse((736, 742, 784, 790), fill=rgba("#1b1c2b", 255))
    d.line((760, 510, 760, 610), fill=rgba("#1b1c2b", 255), width=3)
    # river reflection
    d.rectangle((0, 1080, W, 1370), fill=rgba("#4f5368", 255))
    for i in range(35):
        y = 1090 + i * 8
        alpha = max(15, 120 - i * 3)
        width = rng.randint(60, 500)
        x0 = rng.randint(0, W - width)
        d.line((x0, y, x0 + width, y), fill=rgba(rng.choice(["#f2b788", "#d6c2cb", "#8188a1"]), alpha), width=2)
    d.rectangle((0, 1360, W, H), fill=rgba("#171926", 255))
    # birds
    for bx, by, s in [(300, 410, 1.0), (350, 450, 0.7), (260, 460, 0.6)]:
        d.arc((bx - 20 * s, by - 10 * s, bx, by + 10 * s), 210, 330, fill=rgba("#232332", 220), width=3)
        d.arc((bx, by - 10 * s, bx + 20 * s, by + 10 * s), 210, 330, fill=rgba("#232332", 220), width=3)
    paste_text(image, "CITY WEEKEND", (100, 1440), ImageFont.truetype(str(SANS_BOLD), 62), "#f6eadd")
    paste_text(image, "GOLDEN HOUR / 18:42", (104, 1524), ImageFont.truetype(str(MONO), 21), "#d8c2b6")
    grain(image, rng, 9)
    vignette(image, 115)
    return image.convert("RGB")


def cover_mountain() -> Image.Image:
    rng = random.Random(SEED + 10)
    image = gradient((W, H), "#a5b7b1", "#d8d1b9", 15).convert("RGBA")
    radial_glow(image, (820, 430), 420, "#fff4d8", 150)
    d = ImageDraw.Draw(image, "RGBA")
    layers = [
        ("#86998d", 890, 0.3),
        ("#6e857a", 1000, 0.55),
        ("#536b61", 1120, 0.75),
        ("#394f48", 1260, 1.0),
    ]
    for color, base_y, alpha in layers:
        pts = [(0, base_y + rng.randint(-40, 40))]
        for i in range(1, 9):
            pts.append((i * W / 8, base_y - rng.randint(40, 240) * alpha + rng.randint(-40, 40)))
        pts += [(W, base_y + 120), (W, H), (0, H)]
        d.polygon(pts, fill=rgba(color, 255))
        # fog
        fog = Image.new("RGBA", image.size, (0, 0, 0, 0))
        fd = ImageDraw.Draw(fog)
        fd.ellipse((-200, base_y - 160, W + 200, base_y + 80), fill=rgba("#f4f0df", 50))
        image.alpha_composite(fog.filter(ImageFilter.GaussianBlur(45)))
    # trail
    d.line((610, 1600, 690, 1320, 760, 1220, 820, 1160), fill=rgba("#c7bca1", 150), width=7)
    # hiker silhouettes
    for x, y, s in [(680, 1180, 1.0), (720, 1200, 0.8)]:
        d.ellipse((x - 10 * s, y - 70 * s, x + 10 * s, y - 50 * s), fill=rgba("#262f2a", 255))
        d.line((x, y - 52 * s, x, y - 18 * s), fill=rgba("#262f2a", 255), width=int(8 * s))
        d.line((x, y - 18 * s, x - 16 * s, y + 20 * s), fill=rgba("#262f2a", 255), width=int(4 * s))
        d.line((x, y - 18 * s, x + 16 * s, y + 20 * s), fill=rgba("#262f2a", 255), width=int(4 * s))
        d.line((x, y - 45 * s, x + 24 * s, y - 8 * s), fill=rgba("#262f2a", 255), width=int(3 * s))
    # foreground pines
    for x, y, scale in [(100, 1410, 1.2), (1080, 1370, 0.9), (930, 1480, 0.6)]:
        d.rectangle((x - 6, y, x + 6, y + 170), fill=rgba("#2d3a33", 255))
        for layer in range(4):
            half = (110 - layer * 22) * scale
            top = y - 240 + layer * 85
            d.polygon([(x, top), (x - half, top + 150), (x + half, top + 150)], fill=rgba("#33473d", 255))
    paste_text(image, "INTO THE WILD", (100, 1436), ImageFont.truetype(str(SANS_BOLD), 60), "#f5f0e4")
    paste_text(image, "ALT. 2,480 M / WEEKEND 02", (104, 1522), ImageFont.truetype(str(MONO), 20), "#e1dccb")
    grain(image, rng, 8)
    vignette(image, 100)
    return image.convert("RGB")


def cover_snow_portrait() -> Image.Image:
    rng = random.Random(SEED + 11)
    image = gradient((W, H), "#41596d", "#c1d8dd", 12).convert("RGBA")
    radial_glow(image, (600, 480), 560, "#e8f7ff", 160)
    bokeh(image, rng, 65, ["#e9f6ff", "#ffffff", "#accbdc"], area=(0, 0, 1, 0.8))
    d = ImageDraw.Draw(image, "RGBA")
    # crown crystal shapes
    crown_points = [(410, 420), (452, 290), (510, 390), (560, 250), (612, 385), (680, 300), (710, 430)]
    d.line(crown_points, fill=rgba("#ecf7ff", 220), width=7)
    for i in range(len(crown_points) - 1):
        x1, y1 = crown_points[i]
        x2, y2 = crown_points[i + 1]
        d.polygon([(x1, y1), (x2, y2), ((x1 + x2) / 2, 450)], fill=rgba("#d9ecf4", 50))
    # hair + shoulders
    d.ellipse((410, 420, 800, 900), fill=rgba("#2b2b33", 255))
    d.ellipse((466, 488, 748, 842), fill=rgba("#e6d4c7", 255))
    d.ellipse((430, 760, 790, 1190), fill=rgba("#e9e0d6", 220))
    d.polygon([(390, 1120), (820, 1120), (1010, 1600), (190, 1600)], fill=rgba("#dce7e9", 255))
    d.polygon([(500, 1130), (720, 1130), (810, 1600), (410, 1600)], fill=rgba("#c7d9df", 255))
    # facial suggestion
    for x in (558, 654):
        d.arc((x - 26, 640, x + 26, 680), 190, 350, fill=rgba("#4e4947", 255), width=5)
    d.line((606, 676, 596, 740), fill=rgba("#c3a697", 180), width=2)
    d.arc((574, 752, 634, 792), 20, 160, fill=rgba("#a46e6d", 230), width=5)
    # icy shards
    for _ in range(24):
        x = rng.uniform(0, W)
        y = rng.uniform(0, H)
        size = rng.uniform(16, 90)
        d.polygon([(x, y - size), (x + size * 0.35, y), (x, y + size * 0.4), (x - size * 0.3, y)], fill=rgba("#f1fbff", rng.randint(40, 120)))
    # snowflakes
    for _ in range(90):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        r = rng.uniform(2, 5)
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgba("#ffffff", rng.randint(100, 230)))
    paste_text(image, "FROST PORTRAIT", (100, 1430), ImageFont.truetype(str(SERIF_ITALIC), 60), "#f4fbff")
    paste_text(image, "WINTER COURT / STUDY 01", (104, 1520), ImageFont.truetype(str(MONO), 20), "#d2e8ee")
    grain(image, rng, 8)
    vignette(image, 95)
    return image.convert("RGB")


def cover_studio_portrait() -> Image.Image:
    rng = random.Random(SEED + 12)
    image = gradient((W, H), "#493c45", "#1b1a20", 18).convert("RGBA")
    radial_glow(image, (430, 420), 610, "#f4cfc0", 140)
    bokeh(image, rng, 30, ["#e9c5b7", "#b88d86"], area=(0, 0, 1, 0.55))
    d = ImageDraw.Draw(image, "RGBA")
    # soft backdrop shape
    d.ellipse((100, 470, 1100, 1700), fill=rgba("#6d5559", 95))
    # hair
    d.ellipse((428, 386, 850, 1010), fill=rgba("#201a1b", 255))
    d.ellipse((498, 470, 794, 908), fill=rgba("#d8b7a4", 255))
    # neck/shoulders
    d.rounded_rectangle((568, 844, 714, 1010), 50, fill=rgba("#cda58f", 255))
    d.polygon([(412, 1030), (858, 1030), (1040, 1600), (240, 1600)], fill=rgba("#2e2429", 255))
    d.polygon([(524, 1020), (760, 1020), (840, 1600), (442, 1600)], fill=rgba("#87595e", 255))
    # face
    for x in (568, 690):
        d.arc((x - 34, 668, x + 34, 712), 190, 350, fill=rgba("#3a2b2a", 255), width=5)
    d.line((626, 710, 620, 784), fill=rgba("#b38576", 160), width=3)
    d.arc((584, 806, 670, 848), 18, 162, fill=rgba("#9e5c5b", 255), width=6)
    # hair strands
    for i in range(18):
        x0 = rng.uniform(470, 820)
        d.arc((x0 - 130, 380, x0 + 130, 980), rng.randint(200, 250), rng.randint(280, 340), fill=rgba("#34272a", 130), width=3)
    # earring
    d.ellipse((780, 746, 806, 772), fill=rgba("#e9d4b1", 255))
    d.ellipse((782, 774, 804, 838), outline=rgba("#e9d4b1", 230), width=3)
    # light leak
    leak = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(leak)
    ld.ellipse((-260, 180, 480, 940), fill=rgba("#f6d4b7", 55))
    image.alpha_composite(leak.filter(ImageFilter.GaussianBlur(80)))
    paste_text(image, "SOFT FOCUS", (100, 1436), ImageFont.truetype(str(SERIF_ITALIC), 64), "#f8ede7")
    paste_text(image, "PORTRAIT SESSION / 04", (104, 1526), ImageFont.truetype(str(MONO), 20), "#d9c1b7")
    grain(image, rng, 10)
    vignette(image, 125)
    return image.convert("RGB")


COVERS = {
    "pet-sticker": cover_pet_sticker,
    "pet-editorial": cover_pet_editorial,
    "wedding-film": cover_wedding_film,
    "wedding-garden": cover_wedding_garden,
    "holiday-santa": cover_holiday_santa,
    "holiday-lights": cover_holiday_lights,
    "travel-postcard": cover_coastal,
    "product-editorial": cover_product,
    "city-weekend": cover_city,
    "mountain-escape": cover_mountain,
    "snow-portrait": cover_snow_portrait,
    "studio-portrait": cover_studio_portrait,
}

CAPTIONS = {
    "pet-sticker": "SOFT COMPANION",
    "pet-editorial": "SLOW AFTERNOON",
    "wedding-film": "DUSK VOWS",
    "wedding-garden": "GARDEN VOWS",
    "holiday-santa": "A LITTLE WONDER",
    "holiday-lights": "WINTER LIGHTS",
    "travel-postcard": "COASTAL POSTCARD",
    "product-editorial": "STILL LIFE / 07",
    "city-weekend": "CITY WEEKEND",
    "mountain-escape": "INTO THE WILD",
    "snow-portrait": "FROST PORTRAIT",
    "studio-portrait": "SOFT FOCUS",
}


def make_result(slug: str, cover: Image.Image, index: int) -> Image.Image:
    rng = random.Random(SEED + 200 + index)
    width, height = 1600, 1200
    base = cover.copy().resize((width, height), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(28))
    base = Image.blend(base, Image.new("RGB", base.size, (15, 16, 17)), 0.45).convert("RGBA")
    # soft glare
    radial_glow(base, (1240, 210), 430, "#d8e6cf", 42)
    # print card
    card_w, card_h = 790, 1030
    x0 = (width - card_w) // 2
    y0 = (height - card_h) // 2 - 8
    soft_shadow(base, (x0 + 22, y0 + 30, x0 + card_w + 22, y0 + card_h + 30), 56, 115)
    d = ImageDraw.Draw(base, "RGBA")
    d.rounded_rectangle((x0, y0, x0 + card_w, y0 + card_h), 18, fill=rgba("#f2eee6", 255))
    inner_w, inner_h = card_w - 64, card_h - 184
    inner = cover.resize((inner_w, inner_h), Image.Resampling.LANCZOS)
    # make the print square-ish crop from the portrait
    base.paste(inner, (x0 + 32, y0 + 32))
    d = ImageDraw.Draw(base, "RGBA")
    d.rectangle((x0 + 32, y0 + 32, x0 + 32 + inner_w, y0 + 32 + inner_h), outline=rgba("#0f0e0c", 30), width=2)
    caption = CAPTIONS[slug]
    paste_text(base, caption, (x0 + 34, y0 + inner_h + 72), ImageFont.truetype(str(SERIF), 36), "#26231f")
    paste_text(base, f"LUMA STUDIO   ·   EDITION {index + 1:02d}", (x0 + 36, y0 + inner_h + 126), ImageFont.truetype(str(MONO), 17), "#81796d")
    # stamp
    d.ellipse((x0 + card_w - 128, y0 + card_h - 132, x0 + card_w - 48, y0 + card_h - 52), outline=rgba("#9d9a6a", 180), width=2)
    d.ellipse((x0 + card_w - 118, y0 + card_h - 122, x0 + card_w - 58, y0 + card_h - 62), outline=rgba("#9d9a6a", 110), width=1)
    paste_text(base, "L", (x0 + card_w - 87, y0 + card_h - 108), ImageFont.truetype(str(SERIF), 34), "#9d9a6a", anchor="ma")
    # outer marks
    paste_text(base, "YOUR EDITION", (78, 78), ImageFont.truetype(str(MONO), 20), "#d8d4c8")
    paste_text(base, "MADE WITH LUMA", (78, 1086), ImageFont.truetype(str(MONO), 17), "#b7b3a8")
    paste_text(base, f"No. {index + 1:02d} / 12", (width - 78, 1086), ImageFont.truetype(str(MONO), 17), "#b7b3a8", anchor="ra")
    grain(base, rng, 6)
    vignette(base, 72)
    return base.convert("RGB")


def main() -> None:
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    RESULT_DIR.mkdir(parents=True, exist_ok=True)
    covers: dict[str, Image.Image] = {}
    for index, (slug, factory) in enumerate(COVERS.items()):
        cover = factory()
        cover.save(COVER_DIR / f"{slug}.jpg", quality=89, optimize=True, progressive=True)
        covers[slug] = cover
        print(f"cover  {slug:22} {cover.size}")
    for index, (slug, cover) in enumerate(covers.items()):
        result = make_result(slug, cover, index)
        result.save(RESULT_DIR / f"{slug}.jpg", quality=91, optimize=True, progressive=True)
        print(f"result {slug:22} {result.size}")


if __name__ == "__main__":
    main()
