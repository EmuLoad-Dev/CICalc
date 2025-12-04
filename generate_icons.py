#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成微信小程序 tabBar 占位图标
需要安装 Pillow: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("请先安装 Pillow: pip install Pillow")
    exit(1)

# 图标尺寸（微信小程序推荐 81x81）
ICON_SIZE = 81

# 颜色定义
COLOR_NORMAL = (153, 153, 153)  # #999999 未选中状态
COLOR_ACTIVE = (0, 122, 255)    # #007AFF 选中状态
COLOR_BG = (255, 255, 255)       # 白色背景

def create_icon(filename, color, text=""):
    """创建图标"""
    # 创建图像
    img = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆形背景
    margin = 5
    draw.ellipse(
        [margin, margin, ICON_SIZE - margin, ICON_SIZE - margin],
        fill=color,
        outline=None
    )
    
    # 如果有文本，绘制文本（简化版，使用默认字体）
    if text:
        try:
            # 尝试使用系统字体
            font_size = 20
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", font_size)
            except:
                font = ImageFont.load_default()
        
        # 计算文本位置（居中）
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((ICON_SIZE - text_width) // 2, (ICON_SIZE - text_height) // 2)
        
        draw.text(position, text, fill=(255, 255, 255), font=font)
    
    # 保存图像
    img.save(filename, 'PNG')
    print(f"已创建: {filename}")

def main():
    # 确保目录存在
    icon_dir = "miniprogram/images"
    os.makedirs(icon_dir, exist_ok=True)
    
    # 创建图标
    icons = [
        ("calc.png", COLOR_NORMAL, "计"),
        ("calc-active.png", COLOR_ACTIVE, "计"),
        ("savings.png", COLOR_NORMAL, "存"),
        ("savings-active.png", COLOR_ACTIVE, "存"),
        ("annual.png", COLOR_NORMAL, "年"),
        ("annual-active.png", COLOR_ACTIVE, "年"),
    ]
    
    for filename, color, text in icons:
        filepath = os.path.join(icon_dir, filename)
        create_icon(filepath, color, text)
    
    print("\n所有图标已生成完成！")
    print("现在可以恢复 app.json 中的 iconPath 配置了。")

if __name__ == "__main__":
    main()

