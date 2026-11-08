#!/usr/bin/env python3
"""Google Play store-listing graphics, generated from the game's own art.

    python3 scripts/gen-store-graphics.py <fonts-dir>

<fonts-dir> must contain Orbitron[wght].ttf and ShareTechMono-Regular.ttf
(Google Fonts, OFL — https://github.com/google/fonts). Output:
docs/play-store/

- icon-512.png              app icon (512×512, opaque)
- feature-graphic-{pl,en}.png  1024×500, no transparency
- screenshots/*.png         phone screenshots from public/screens, with the
                            web-only "Download the Android app (APK)" banner
                            removed — which also brings them under Play's 2:1
                            aspect-ratio limit.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'play-store'
FONTS = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('fonts')

BG_CENTER = (26, 10, 46)
BG_EDGE = (4, 3, 11)
CYAN = (0, 245, 255)
PINK = (255, 45, 120)


def radial_background(w: int, h: int, cx: float = 0.5, cy: float = 0.5) -> Image.Image:
    """Dark violet radial gradient, like the game's loading screen."""
    small = Image.new('RGB', (w // 4, h // 4))
    px = small.load()
    sw, sh = small.size
    max_d = ((max(cx, 1 - cx) * sw) ** 2 + (max(cy, 1 - cy) * sh) ** 2) ** 0.5
    for y in range(sh):
        for x in range(sw):
            d = ((x - cx * sw) ** 2 + (y - cy * sh) ** 2) ** 0.5 / max_d
            t = min(1.0, d) ** 0.8
            px[x, y] = tuple(int(BG_CENTER[i] * (1 - t) + BG_EDGE[i] * t) for i in range(3))
    return small.resize((w, h), Image.BICUBIC)


def grid(img: Image.Image, step: int, alpha: int) -> None:
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = img.size
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=(0, 245, 255, alpha))
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=(0, 245, 255, alpha))
    img.alpha_composite(overlay)


def glow_text(img: Image.Image, xy, text: str, font, color, blur: int = 10) -> None:
    """Text with a neon glow (blurred copy underneath)."""
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text(xy, text, font=font, fill=color + (255,))
    glow = layer.filter(ImageFilter.GaussianBlur(blur))
    img.alpha_composite(glow)
    img.alpha_composite(glow)
    img.alpha_composite(layer)


def orbitron(size: int, weight: int = 900) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(str(FONTS / 'Orbitron[wght].ttf'), size)
    try:
        font.set_variation_by_axes([weight])
    except Exception:
        pass
    return font


def mono(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / 'ShareTechMono-Regular.ttf'), size)


def logo(size: int) -> Image.Image:
    return Image.open(ROOT / 'src' / 'assets' / 'logo.webp').convert('RGBA').resize((size, size), Image.LANCZOS)


def make_icon() -> None:
    img = radial_background(512, 512).convert('RGBA')
    mark = logo(560)  # the artwork has generous transparent margins
    img.alpha_composite(mark, ((512 - 560) // 2, (512 - 560) // 2 + 4))
    img.convert('RGB').save(OUT / 'icon-512.png', optimize=True)


TAGLINES = {
    'pl': ('Cyberpunkowe RPG bez pay-to-win', 'Lochy · Bossowie · PvP · Gildie'),
    'en': ('A cyberpunk RPG with no pay-to-win', 'Dungeons · Bosses · PvP · Guilds'),
}


def make_feature(lang: str) -> None:
    w, h = 1024, 500
    img = radial_background(w, h, cx=0.28, cy=0.5).convert('RGBA')
    grid(img, 32, 14)
    img.alpha_composite(logo(470), (40, 15))

    title = orbitron(78)
    x, y = 455, 140
    glow_text(img, (x, y), 'Glitch', title, CYAN, blur=12)
    gw = ImageDraw.Draw(img).textlength('Glitch', font=title)
    glow_text(img, (x + gw, y), 'Soul', title, PINK, blur=12)

    line1, line2 = TAGLINES[lang]
    d = ImageDraw.Draw(img)
    d.text((x + 4, y + 112), line1, font=mono(30), fill=(235, 238, 255, 255))
    d.text((x + 4, y + 160), line2, font=mono(26), fill=(0, 245, 255, 220))
    img.convert('RGB').save(OUT / f'feature-graphic-{lang}.png', optimize=True)


# Rows 64–119 of the 840×1720 web screenshots hold the "Download the Android
# app ↓ APK" banner (between the header's bottom border and the content).
BANNER_ROWS = (64, 120)


def make_screenshots() -> None:
    dst = OUT / 'screenshots'
    dst.mkdir(parents=True, exist_ok=True)
    for src in sorted((ROOT / 'public' / 'screens').glob('*.webp')):
        im = Image.open(src).convert('RGB')
        w, h = im.size
        top, bottom = BANNER_ROWS
        out = Image.new('RGB', (w, h - (bottom - top)))
        out.paste(im.crop((0, 0, w, top)), (0, 0))
        out.paste(im.crop((0, bottom, w, h)), (0, top))
        assert max(out.size) <= 2 * min(out.size), f'{src.name}: still over the 2:1 limit'
        out.save(dst / f'{src.stem}.png', optimize=True)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    make_icon()
    for lang in TAGLINES:
        make_feature(lang)
    make_screenshots()
    for p in sorted(OUT.rglob('*.png')):
        with Image.open(p) as im:
            print(f'{p.relative_to(ROOT)}  {im.size[0]}×{im.size[1]}  {im.mode}  {p.stat().st_size // 1024} kB')
