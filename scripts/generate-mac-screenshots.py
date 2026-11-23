#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["pillow>=10.0.0"]
# ///
"""
Generate Mac App Store Presentation Screenshots (16:10 aspect ratio: 2880x1800 and 2560x1600)
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SLIDES = [
    {
        "file": "01_learn.png",
        "title": "Comprehensive AI Curriculum",
        "subtitle": "199 progressive lessons from fundamentals to production systems",
    },
    {
        "file": "02_lesson.png",
        "title": "Production Systems Engineering",
        "subtitle": "Vector math, interactive code listings, and architecture diagrams",
    },
    {
        "file": "03_practice.png",
        "title": "Hands-On Engineering Labs",
        "subtitle": "Practice real-world distributed training and inference algorithms",
    },
    {
        "file": "04_quiz.png",
        "title": "Concept Check Quizzes",
        "subtitle": "Validate architectural trade-offs and systems contracts",
    },
    {
        "file": "05_tracks.png",
        "title": "Curated Learning Tracks",
        "subtitle": "Structured career paths for AI and LLM systems engineers",
    },
    {
        "file": "06_track.png",
        "title": "Deep Dive Specializations",
        "subtitle": "Master High-Throughput Serving, Agents, and GPU Compilers",
    },
    {
        "file": "07_glossary.png",
        "title": "AI Systems Technical Glossary",
        "subtitle": "Over 750 production AI terms with formal engineering contracts",
    },
    {
        "file": "08_term.png",
        "title": "Architectural Terms & Engines",
        "subtitle": "In-depth breakdowns of vLLM, SGLang, Megatron, and FlashAttention",
    },
    {
        "file": "09_account.png",
        "title": "Cross-Platform Progress Sync",
        "subtitle": "Seamless state synchronization across Web, iPhone, iPad, and Mac",
    },
]

def get_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for font_path in candidates:
        if os.path.exists(font_path):
            try:
                index = 1 if bold and "HelveticaNeue" in font_path else 0
                return ImageFont.truetype(font_path, size, index=index)
            except Exception:
                pass
    return ImageFont.load_default()

def create_mac_screenshot(source_path, title, subtitle, target_width=2880, target_height=1800):
    # Base background: Deep refined dark slate gradient
    bg = Image.new("RGBA", (target_width, target_height), (15, 23, 42, 255)) # slate-900
    draw = ImageDraw.Draw(bg)

    # Subtle background accent radial gradient / glow
    accent = Image.new("RGBA", (target_width, target_height), (0, 0, 0, 0))
    accent_draw = ImageDraw.Draw(accent)
    center_x = target_width // 2
    center_y = int(target_height * 0.6)
    accent_draw.ellipse(
        (center_x - 900, center_y - 500, center_x + 900, center_y + 500),
        fill=(37, 99, 235, 30) # blue-600 subtle glow
    )
    accent = accent.filter(ImageFilter.GaussianBlur(120))
    bg.alpha_composite(accent)
    draw = ImageDraw.Draw(bg)

    # Typography
    font_title = get_font(int(target_height * 0.042), bold=True)
    font_sub = get_font(int(target_height * 0.022), bold=False)

    # Title & Subtitle positioning
    title_bbox = draw.textbbox((0, 0), title, font=font_title)
    title_w = title_bbox[2] - title_bbox[0]
    title_x = (target_width - title_w) // 2
    title_y = int(target_height * 0.075)

    sub_bbox = draw.textbbox((0, 0), subtitle, font=font_sub)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (target_width - sub_w) // 2
    sub_y = title_y + (title_bbox[3] - title_bbox[0]) + int(target_height * 0.015)

    draw.text((title_x, title_y), title, fill=(248, 250, 252, 255), font=font_title) # slate-50
    draw.text((sub_x, sub_y), subtitle, fill=(148, 163, 184, 255), font=font_sub) # slate-400

    # macOS App Window Frame
    win_w = int(target_width * 0.82)
    win_h = int(target_height * 0.74)
    win_x = (target_width - win_w) // 2
    win_y = int(target_height * 0.22)
    titlebar_h = int(win_h * 0.05)
    corner_radius = 18

    # Window Drop Shadow
    shadow_pad = 50
    shadow = Image.new("RGBA", (win_w + shadow_pad * 2, win_h + shadow_pad * 2), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle(
        (shadow_pad, shadow_pad + 15, shadow_pad + win_w, shadow_pad + win_h + 15),
        radius=corner_radius,
        fill=(0, 0, 0, 160)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    bg.alpha_composite(shadow, (win_x - shadow_pad, win_y - shadow_pad))

    # Window Container
    window = Image.new("RGBA", (win_w, win_h), (30, 41, 59, 255)) # slate-800
    w_draw = ImageDraw.Draw(window)

    # Window Titlebar (macOS style)
    w_draw.rounded_rectangle((0, 0, win_w, titlebar_h + corner_radius), radius=corner_radius, fill=(30, 41, 59, 255))
    w_draw.rectangle((0, corner_radius, win_w, titlebar_h), fill=(30, 41, 59, 255))
    w_draw.line((0, titlebar_h, win_w, titlebar_h), fill=(51, 65, 85, 255), width=1)

    # Traffic lights (Red, Yellow, Green)
    btn_r = int(titlebar_h * 0.22)
    btn_y = titlebar_h // 2
    btn_spacing = int(btn_r * 2.5)
    btn_start_x = int(win_w * 0.02)

    w_draw.ellipse((btn_start_x - btn_r, btn_y - btn_r, btn_start_x + btn_r, btn_y + btn_r), fill=(239, 68, 68, 255)) # Red
    w_draw.ellipse((btn_start_x + btn_spacing - btn_r, btn_y - btn_r, btn_start_x + btn_spacing + btn_r, btn_y + btn_r), fill=(245, 158, 11, 255)) # Yellow
    w_draw.ellipse((btn_start_x + btn_spacing * 2 - btn_r, btn_y - btn_r, btn_start_x + btn_spacing * 2 + btn_r, btn_y + btn_r), fill=(16, 185, 129, 255)) # Green

    # Window title centered
    font_win_title = get_font(int(titlebar_h * 0.38), bold=False)
    wt_text = "LeetLLM — AI & LLM Systems Engineering"
    wt_bbox = w_draw.textbbox((0, 0), wt_text, font=font_win_title)
    wt_x = (win_w - (wt_bbox[2] - wt_bbox[0])) // 2
    wt_y = (titlebar_h - (wt_bbox[3] - wt_bbox[1])) // 2
    w_draw.text((wt_x, wt_y), wt_text, fill=(148, 163, 184, 255), font=font_win_title)

    # App Screen Content
    content_h = win_h - titlebar_h
    content_w = win_w
    if os.path.exists(source_path):
        app_img = Image.open(source_path).convert("RGBA")
        # Aspect fill/fit content area
        aspect_ratio = app_img.width / app_img.height
        if aspect_ratio > (content_w / content_h):
            # Fit by height
            scale = content_h / app_img.height
            scaled_w = int(app_img.width * scale)
            scaled = app_img.resize((scaled_w, content_h), Image.Resampling.LANCZOS)
            crop_x = (scaled_w - content_w) // 2
            cropped = scaled.crop((crop_x, 0, crop_x + content_w, content_h))
            window.paste(cropped, (0, titlebar_h))
        else:
            # Fit by width
            scale = content_w / app_img.width
            scaled_h = int(app_img.height * scale)
            scaled = app_img.resize((content_w, scaled_h), Image.Resampling.LANCZOS)
            cropped = scaled.crop((0, 0, content_w, min(content_h, scaled_h)))
            window.paste(cropped, (0, titlebar_h))

    # Mask bottom corners of window
    mask = Image.new("L", (win_w, win_h), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle((0, 0, win_w, win_h), radius=corner_radius, fill=255)

    # Composite window
    bg.paste(window, (win_x, win_y), mask)

    # Window border outline
    draw.rounded_rectangle((win_x, win_y, win_x + win_w, win_y + win_h), radius=corner_radius, outline=(71, 85, 105, 180), width=1)

    return bg.convert("RGB")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, ".."))
    screenshots_dir = os.path.join(repo_root, "mobile", "ios", "LeetLLM", "screenshots")
    ipad_dir = os.path.join(screenshots_dir, "ipad")
    mac_dir = os.path.join(screenshots_dir, "mac")
    mac_2880_dir = os.path.join(mac_dir, "2880x1800")
    mac_2560_dir = os.path.join(mac_dir, "2560x1600")

    os.makedirs(mac_dir, exist_ok=True)
    os.makedirs(mac_2880_dir, exist_ok=True)
    os.makedirs(mac_2560_dir, exist_ok=True)

    print("🖼️ Generating Mac App Store Presentation Screenshots (16:10 aspect ratio)...")

    for slide in SLIDES:
        fname = slide["file"]
        # Prefer ipad screenshot for denser layout, fallback to root screenshot
        src_path = os.path.join(ipad_dir, fname)
        if not os.path.exists(src_path):
            src_path = os.path.join(screenshots_dir, fname)

        if not os.path.exists(src_path):
            print(f"⚠️ Warning: Source screenshot {fname} not found in {screenshots_dir}")
            continue

        print(f"  • Generating {fname} ({slide['title']})...")

        # 2880 x 1800 (16:10 Retina)
        img_2880 = create_mac_screenshot(src_path, slide["title"], slide["subtitle"], 2880, 1800)
        img_2880.save(os.path.join(mac_2880_dir, fname), "PNG", optimize=True)
        # Also copy to root mac/ folder
        img_2880.save(os.path.join(mac_dir, fname), "PNG", optimize=True)

        # 2560 x 1600 (16:10 standard Retina)
        img_2560 = create_mac_screenshot(src_path, slide["title"], slide["subtitle"], 2560, 1600)
        img_2560.save(os.path.join(mac_2560_dir, fname), "PNG", optimize=True)

    print(f"✅ Successfully generated all Mac screenshots in {mac_dir}")
    print(f"  - 2880x1800: {mac_2880_dir}")
    print(f"  - 2560x1600: {mac_2560_dir}")

if __name__ == "__main__":
    main()
