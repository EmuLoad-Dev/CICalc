// components/chart/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 时间序列数据
    data: {
      type: Array,
      value: [],
      observer: function(newVal) {
        if (newVal && newVal.length > 0) {
          this.drawChart();
        }
      }
    },
    // 图表标题
    title: {
      type: String,
      value: '资产增长曲线'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    canvasWidth: 0,
    canvasHeight: 0,
    ctx: null,
    padding: {
      top: 80,
      right: 20,
      bottom: 45,
      left: 50
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached: function() {
      // 组件挂载后初始化 Canvas
      this.initCanvas();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 初始化 Canvas
    initCanvas: function() {
      const query = this.createSelectorQuery();
      query.select('#chartCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          // 获取设备像素比，通过系统信息获取
          let dpr = 1;
          if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
            try {
              const systemInfo = wx.getSystemInfoSync();
              dpr = systemInfo.pixelRatio || 1;
            } catch (e) {
              dpr = 1;
            }
          }
          
          const width = res[0].width;
          const height = res[0].height;

          // 设置 Canvas 实际渲染尺寸
          canvas.width = width * dpr;
          canvas.height = height * dpr;

          // 缩放上下文以适配高分辨率屏幕
          ctx.scale(dpr, dpr);

          this.setData({
            canvasWidth: width,
            canvasHeight: height,
            ctx: ctx
          });

          // 如果已有数据，立即绘制
          if (this.data.data && this.data.data.length > 0) {
            this.drawChart();
          }
        });
    },

    // 绘制图表
    drawChart: function() {
      const { ctx, canvasWidth, canvasHeight, padding, data } = this.data;
      
      if (!ctx || !data || data.length === 0) {
        return;
      }

      // 清空画布
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 计算绘图区域
      const chartWidth = canvasWidth - padding.left - padding.right;
      const chartHeight = canvasHeight - padding.top - padding.bottom;

      // 提取数据
      const timeData = data.map(item => item.time);
      const assetsData = data.map(item => item.totalAssets);
      const investmentData = data.map(item => item.totalInvestment);
      const returnData = data.map(item => item.totalReturn);

      // 计算数据范围
      // 使用 apply 方法替代扩展运算符，避免 Babel runtime 依赖
      const maxTime = timeData.length > 0 ? Math.max.apply(null, timeData) : 0;
      const minTime = timeData.length > 0 ? Math.min.apply(null, timeData) : 0;
      const allValues = assetsData.concat(investmentData, returnData);
      const maxValue = allValues.length > 0 ? Math.max.apply(null, allValues) : 0;
      const minValue = allValues.length > 0 ? Math.min.apply(null, allValues.concat([0])) : 0; // 确保最小值至少为0

      // 数据映射函数
      const mapX = (value) => {
        const range = maxTime - minTime || 1;
        return padding.left + ((value - minTime) / range) * chartWidth;
      };

      const mapY = (value) => {
        const range = maxValue - minValue || 1;
        return padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
      };

      // 绘制背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 绘制网格线
      this.drawGrid(ctx, padding, chartWidth, chartHeight, minTime, maxTime, minValue, maxValue, mapX, mapY);

      // 绘制坐标轴
      this.drawAxes(ctx, padding, chartWidth, chartHeight, minTime, maxTime, minValue, maxValue, mapX, mapY);

      // 绘制折线
      this.drawLine(ctx, timeData, assetsData, mapX, mapY, '#66B3FF', 2);
      this.drawLine(ctx, timeData, investmentData, mapX, mapY, '#7DD87F', 2);
      this.drawLine(ctx, timeData, returnData, mapX, mapY, '#FFB366', 2);

      // 绘制数据点（可选，只在数据点较少时显示）
      if (data.length <= 50) {
        this.drawPoints(ctx, timeData, assetsData, mapX, mapY, '#66B3FF', 2.5);
        this.drawPoints(ctx, timeData, investmentData, mapX, mapY, '#7DD87F', 2.5);
        this.drawPoints(ctx, timeData, returnData, mapX, mapY, '#FFB366', 2.5);
      }

      // 绘制标题
      this.drawTitle(ctx, canvasWidth, padding, this.data.title);

      // 绘制图例
      this.drawLegend(ctx, canvasWidth, padding);
    },

    // 绘制网格线
    drawGrid: function(ctx, padding, chartWidth, chartHeight, minTime, maxTime, minValue, maxValue, mapX, mapY) {
      ctx.strokeStyle = '#F0F0F0';
      ctx.lineWidth = 1;
      // 设置虚线样式（如果支持）
      if (ctx.setLineDash) {
        ctx.setLineDash([2, 2]);
      }

      // 垂直网格线（时间轴）
      const timeSteps = Math.min(10, maxTime - minTime + 1);
      for (let i = 0; i <= timeSteps; i++) {
        const time = minTime + (maxTime - minTime) * (i / timeSteps);
        const x = mapX(time);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
      }

      // 水平网格线（数值轴）
      const valueSteps = 5;
      for (let i = 0; i <= valueSteps; i++) {
        const value = minValue + (maxValue - minValue) * (i / valueSteps);
        const y = mapY(value);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }

      // 恢复实线样式
      if (ctx.setLineDash) {
        ctx.setLineDash([]);
      }
    },

    // 绘制坐标轴
    drawAxes: function(ctx, padding, chartWidth, chartHeight, minTime, maxTime, minValue, maxValue, mapX, mapY) {
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;

      // X轴
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.stroke();

      // Y轴
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.stroke();

      // X轴刻度标签
      ctx.fillStyle = '#666666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const timeSteps = Math.min(10, maxTime - minTime + 1);
      for (let i = 0; i <= timeSteps; i++) {
        const time = minTime + (maxTime - minTime) * (i / timeSteps);
        const x = mapX(time);
        const label = Math.round(time).toString();
        ctx.fillText(label, x, padding.top + chartHeight + 6);
      }

      // Y轴刻度标签
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const valueSteps = 5;
      for (let i = 0; i <= valueSteps; i++) {
        const value = minValue + (maxValue - minValue) * (i / valueSteps);
        const y = mapY(value);
        const label = this.formatValue(value);
        ctx.fillText(label, padding.left - 12, y);
      }

      // 轴标签
      ctx.fillStyle = '#333333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      
      // X轴标签（时间）
      ctx.save();
      ctx.translate(padding.left + chartWidth / 2, padding.top + chartHeight + 35);
      ctx.fillText('时间（月）', 0, 0);
      ctx.restore();

      // Y轴标签（金额）- 已取消显示
      // ctx.save();
      // ctx.translate(8, padding.top + chartHeight / 2);
      // ctx.rotate(-Math.PI / 2);
      // ctx.fillText('金额（元）', 0, 0);
      // ctx.restore();
    },

    // 绘制折线
    drawLine: function(ctx, xData, yData, mapX, mapY, color, lineWidth) {
      if (xData.length === 0) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < xData.length; i++) {
        const x = mapX(xData[i]);
        const y = mapY(yData[i]);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    },

    // 绘制数据点
    drawPoints: function(ctx, xData, yData, mapX, mapY, color, radius) {
      ctx.fillStyle = color;
      for (let i = 0; i < xData.length; i++) {
        const x = mapX(xData[i]);
        const y = mapY(yData[i]);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // 绘制图例
    drawLegend: function(ctx, canvasWidth, padding) {
      const legendItems = [
        { label: '累计资产', color: '#66B3FF' },
        { label: '累计投入', color: '#7DD87F' },
        { label: '累计收益', color: '#FFB366' }
      ];

      // 计算图例总宽度，用于水平居中
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      const itemSpacing = 20; // 图例项之间的间距
      const colorBlockWidth = 12;
      const textSpacing = 8; // 颜色块和文字之间的间距
      let totalWidth = 0;
      legendItems.forEach((item, index) => {
        const textWidth = ctx.measureText(item.label).width;
        if (index > 0) {
          totalWidth += itemSpacing;
        }
        totalWidth += colorBlockWidth + textSpacing + textWidth;
      });

      // 水平居中
      const legendStartX = (canvasWidth - totalWidth) / 2;
      const legendY = 55; // 标题下方
      const itemHeight = 22;

      ctx.textBaseline = 'middle';

      let currentX = legendStartX;
      legendItems.forEach((item, index) => {
        const y = legendY;
        
        // 绘制颜色块
        ctx.fillStyle = item.color;
        ctx.fillRect(currentX, y - 5, colorBlockWidth, 10);
        
        // 绘制标签
        ctx.fillStyle = '#333333';
        ctx.fillText(item.label, currentX + colorBlockWidth + textSpacing, y);
        
        // 更新下一个图例项的x位置
        const textWidth = ctx.measureText(item.label).width;
        currentX += colorBlockWidth + textSpacing + textWidth + itemSpacing;
      });
    },

    // 绘制标题
    drawTitle: function(ctx, canvasWidth, padding, title) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, canvasWidth / 2, 10);
    },

    // 格式化数值（简化显示）
    formatValue: function(value) {
      if (value === 0) return '0';
      if (Math.abs(value) >= 100000000) {
        return (value / 100000000).toFixed(1) + '亿';
      } else if (Math.abs(value) >= 10000) {
        return (value / 10000).toFixed(1) + '万';
      } else if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1) + '千';
      } else {
        return Math.round(value).toString();
      }
    },

    // 触摸事件处理（预留，用于后续交互功能）
    onTouchStart: function(e) {
      // 可以在这里实现触摸交互
    },

    onTouchMove: function(e) {
      // 可以在这里实现拖拽等交互
    },

    onTouchEnd: function(e) {
      // 可以在这里实现触摸结束处理
    }
  }
});

