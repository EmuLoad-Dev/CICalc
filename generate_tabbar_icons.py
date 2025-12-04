#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成微信小程序 tabBar 图标
使用Unicode符号和简单图形绘制
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

def create_calculator_icon(filename, color):
    """创建硬币图标 - 代表计算收益"""
    img = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    center_x = ICON_SIZE // 2
    center_y = ICON_SIZE // 2
    
    # 硬币半径
    coin_radius = 28
    
    # 绘制硬币外圈（粗一点，代表硬币边缘）
    draw.ellipse(
        [center_x - coin_radius, center_y - coin_radius,
         center_x + coin_radius, center_y + coin_radius],
        fill=None,
        outline=color,
        width=3
    )
    
    # 绘制硬币内圈（细一点，增加层次感）
    inner_radius = coin_radius - 4
    draw.ellipse(
        [center_x - inner_radius, center_y - inner_radius,
         center_x + inner_radius, center_y + inner_radius],
        fill=None,
        outline=color,
        width=1
    )
    
    # 绘制人民币符号 ￥（简约设计）
    # 使用线条绘制一个简约的￥符号
    # 竖线
    draw.line(
        [center_x, center_y - 12, center_x, center_y + 12],
        fill=color,
        width=2
    )
    
    # 顶部横线
    draw.line(
        [center_x - 8, center_y - 8, center_x + 8, center_y - 8],
        fill=color,
        width=2
    )
    
    # 中间横线
    draw.line(
        [center_x - 6, center_y, center_x + 6, center_y],
        fill=color,
        width=2
    )
    
    # 底部横线
    draw.line(
        [center_x - 8, center_y + 8, center_x + 8, center_y + 8],
        fill=color,
        width=2
    )
    
    img.save(filename, 'PNG')
    print(f"已创建: {filename}")

def create_piggy_bank_icon(filename, color):
    """创建存钱罐图标"""
    img = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    center_x = ICON_SIZE // 2
    center_y = ICON_SIZE // 2
    
    # 绘制存钱罐主体（椭圆）
    body_width = 50
    body_height = 60
    body_left = center_x - body_width // 2
    body_top = center_y - body_height // 2 + 5
    
    # 使用多个椭圆模拟存钱罐形状
    draw.ellipse(
        [body_left, body_top, body_left + body_width, body_top + body_height],
        fill=None,
        outline=color,
        width=3
    )
    
    # 绘制投币口（顶部小矩形）
    slot_width = 20
    slot_height = 8
    slot_x = center_x - slot_width // 2
    slot_y = body_top - 2
    draw.rounded_rectangle(
        [slot_x, slot_y, slot_x + slot_width, slot_y + slot_height],
        radius=2,
        fill=color,
        outline=None
    )
    
    # 绘制底部（稍大的椭圆）
    bottom_y = body_top + body_height - 10
    draw.ellipse(
        [body_left - 3, bottom_y, body_left + body_width + 3, bottom_y + 15],
        fill=None,
        outline=color,
        width=2
    )
    
    # 绘制眼睛（两个小圆）
    eye_y = body_top + 15
    eye_size = 4
    draw.ellipse(
        [center_x - 12, eye_y, center_x - 12 + eye_size, eye_y + eye_size],
        fill=color,
        outline=None
    )
    draw.ellipse(
        [center_x + 8, eye_y, center_x + 8 + eye_size, eye_y + eye_size],
        fill=color,
        outline=None
    )
    
    # 绘制鼻子（小椭圆）
    nose_y = eye_y + 8
    draw.ellipse(
        [center_x - 3, nose_y, center_x + 3, nose_y + 5],
        fill=color,
        outline=None
    )
    
    img.save(filename, 'PNG')
    print(f"已创建: {filename}")

def create_chart_icon(filename, color):
    """创建图表图标（用于计算年化）"""
    img = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    margin = 15
    chart_width = ICON_SIZE - margin * 2
    chart_height = ICON_SIZE - margin * 2
    
    # 绘制坐标轴
    axis_x = margin
    axis_y = ICON_SIZE - margin
    axis_end_x = ICON_SIZE - margin
    axis_end_y = margin
    
    # X轴
    draw.line(
        [axis_x, axis_y, axis_end_x, axis_y],
        fill=color,
        width=2
    )
    # Y轴
    draw.line(
        [axis_x, axis_y, axis_x, axis_end_y],
        fill=color,
        width=2
    )
    
    # 绘制柱状图（3个柱子）
    bar_width = 12
    bar_spacing = 8
    bar_start_x = axis_x + 10
    bar_bottom = axis_y
    
    # 三个柱子的高度（递增）
    bar_heights = [25, 35, 45]
    for i, height in enumerate(bar_heights):
        bar_x = bar_start_x + i * (bar_width + bar_spacing)
        bar_top = bar_bottom - height
        draw.rectangle(
            [bar_x, bar_top, bar_x + bar_width, bar_bottom],
            fill=color,
            outline=None
        )
    
    # 或者绘制折线图
    # 绘制上升趋势线
    line_points = [
        (axis_x + 5, axis_y - 10),
        (axis_x + 20, axis_y - 25),
        (axis_x + 35, axis_y - 40),
        (axis_x + 50, axis_y - 55),
    ]
    draw.line(line_points, fill=color, width=3)
    
    # 绘制数据点
    for point in line_points:
        draw.ellipse(
            [point[0] - 3, point[1] - 3, point[0] + 3, point[1] + 3],
            fill=color,
            outline=None
        )
    
    img.save(filename, 'PNG')
    print(f"已创建: {filename}")

def create_history_icon(filename, color):
    """创建历史记录图标（时钟样式）"""
    img = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    center_x = ICON_SIZE // 2
    center_y = ICON_SIZE // 2
    
    # 绘制时钟外圈
    radius = 28
    draw.ellipse(
        [center_x - radius, center_y - radius, 
         center_x + radius, center_y + radius],
        fill=None,
        outline=color,
        width=3
    )
    
    # 绘制时钟内圈
    inner_radius = 22
    draw.ellipse(
        [center_x - inner_radius, center_y - inner_radius, 
         center_x + inner_radius, center_y + inner_radius],
        fill=None,
        outline=color,
        width=1
    )
    
    # 绘制12点、3点、6点、9点的刻度
    import math
    for hour in [12, 3, 6, 9]:
        angle = math.radians((hour - 3) * 30)  # 转换为角度，12点在顶部
        x1 = center_x + (radius - 5) * math.cos(angle)
        y1 = center_y + (radius - 5) * math.sin(angle)
        x2 = center_x + radius * math.cos(angle)
        y2 = center_y + radius * math.sin(angle)
        draw.line([x1, y1, x2, y2], fill=color, width=2)
    
    # 绘制时针（指向10点）
    hour_angle = math.radians((10 - 3) * 30)
    hour_length = 12
    hour_x = center_x + hour_length * math.cos(hour_angle)
    hour_y = center_y + hour_length * math.sin(hour_angle)
    draw.line([center_x, center_y, hour_x, hour_y], fill=color, width=3)
    
    # 绘制分针（指向2点）
    minute_angle = math.radians((2 - 3) * 30)
    minute_length = 18
    minute_x = center_x + minute_length * math.cos(minute_angle)
    minute_y = center_y + minute_length * math.sin(minute_angle)
    draw.line([center_x, center_y, minute_x, minute_y], fill=color, width=2)
    
    # 绘制中心点
    draw.ellipse(
        [center_x - 3, center_y - 3, center_x + 3, center_y + 3],
        fill=color,
        outline=None
    )
    
    img.save(filename, 'PNG')
    print(f"已创建: {filename}")

def main():
    # 确保目录存在
    icon_dir = "miniprogram/images"
    os.makedirs(icon_dir, exist_ok=True)
    
    # 创建图标
    print("正在生成计算器图标...")
    create_calculator_icon(os.path.join(icon_dir, "calc.png"), COLOR_NORMAL)
    create_calculator_icon(os.path.join(icon_dir, "calc-active.png"), COLOR_ACTIVE)
    
    print("正在生成存钱罐图标...")
    create_piggy_bank_icon(os.path.join(icon_dir, "savings.png"), COLOR_NORMAL)
    create_piggy_bank_icon(os.path.join(icon_dir, "savings-active.png"), COLOR_ACTIVE)
    
    print("正在生成图表图标...")
    create_chart_icon(os.path.join(icon_dir, "annual.png"), COLOR_NORMAL)
    create_chart_icon(os.path.join(icon_dir, "annual-active.png"), COLOR_ACTIVE)
    
    print("正在生成历史记录图标...")
    create_history_icon(os.path.join(icon_dir, "history.png"), COLOR_NORMAL)
    create_history_icon(os.path.join(icon_dir, "history-active.png"), COLOR_ACTIVE)
    
    print("\n所有图标已生成完成！")
    print("图标文件保存在: miniprogram/images/")

if __name__ == "__main__":
    main()

