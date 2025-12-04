// pages/calc/index.js
const calcUtils = require('../../utils/calc.js');
const templateUtils = require('../../utils/templates.js');

Page({
  data: {
    // 输入字段
    principal: 50000, // 本金（默认5万元）
    fixedInvestment: 2000, // 定投金额（默认每月2000元）
    fixedInvestmentType: 'monthly', // 定投类型：yearly/monthly
    annualRate: '4.5', // 年化收益率（默认4.5%，使用字符串以支持小数点输入）
    duration: 36, // 历时（默认36个月，即3年）
    durationType: 'month', // 历时类型：year/month/day
    compoundPeriod: 'month', // 复利计算周期：year/month/day/closed
    
    // 计算结果
    totalInvestment: 0, // 总投资额
    finalAssets: 0, // 最终资产
    finalReturn: 0, // 最终收益
    totalReturnRate: 0, // 总收益率
    annualizedReturnRate: 0, // 年化收益率（计算结果）
    
    // 图表数据
    chartData: [],
    
    // 模板相关
    showTemplateModal: false, // 是否显示模板选择弹窗
    templateList: [], // 模板列表
    
    // 去广告状态
    isAdFreeActive: false, // 是否已激活去广告
    remainingTimeText: '', // 剩余时间文本
    
    // 边界值常量
    BOUNDS: {
      principal: { min: 0, max: 10000000000 }, // 本金：0 - 100亿
      fixedInvestment: { min: 0, max: 100000000 }, // 定投：0 - 1亿
      annualRate: { min: -100, max: 1000 }, // 年化收益率：-100% - 1000%
      duration: {
        year: { min: 0, max: 100 }, // 年：0 - 100年
        month: { min: 0, max: 1200 }, // 月：0 - 1200个月（100年）
        day: { min: 0, max: 36500 } // 天：0 - 36500天（100年）
      }
    }
  },

  onLoad: function (options) {
    // 检查是否有分享参数
    if (options.share === 'true' && options.data) {
      try {
        const shareData = JSON.parse(decodeURIComponent(options.data));
        // 保存分享数据到实例，等待用户确认
        this.shareData = shareData;
        // 询问用户是否载入数据
        wx.showModal({
          title: '载入分享数据',
          content: '检测到分享的计算数据，是否载入？',
          confirmText: '载入',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 用户确认，载入分享数据
              this.loadFromShareData(this.shareData);
            } else {
              // 用户取消，正常加载保存的数据
              this.loadSavedData();
              this.calculate();
            }
          },
          fail: () => {
            // 对话框失败，正常加载保存的数据
            this.loadSavedData();
            this.calculate();
          }
        });
        return;
      } catch (e) {
        console.error('解析分享数据失败:', e);
      }
    }
    
    // 恢复保存的数据
    this.loadSavedData();
    this.calculate();
    
    // 加载模板列表
    this.loadTemplates();
  },
  
  // 加载模板列表
  loadTemplates: function() {
    // 获取系统模板
    const systemTemplates = templateUtils.getTemplates('calc');
    // 获取用户自定义模板
    const customTemplates = templateUtils.getCustomTemplates('calc');
    // 合并模板列表
    const allTemplates = [...systemTemplates, ...customTemplates];
    this.setData({
      templateList: allTemplates
    });
  },
  
  // 显示模板选择弹窗
  onShowTemplateModal: function() {
    this.setData({
      showTemplateModal: true
    });
  },
  
  // 隐藏模板选择弹窗
  onHideTemplateModal: function() {
    this.setData({
      showTemplateModal: false
    });
  },
  
  // 阻止事件冒泡
  stopPropagation: function() {
    // 空函数，用于阻止事件冒泡
  },
  
  // 选择模板
  onSelectTemplate: function(e) {
    const template = e.currentTarget.dataset.template;
    if (!template || !template.data) {
      wx.showToast({
        title: '模板数据错误',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 应用模板数据
    this.applyTemplate(template.data);
    
    // 关闭弹窗
    this.onHideTemplateModal();
    
    // 提示用户
    wx.showToast({
      title: `已应用：${template.name}`,
      icon: 'success',
      duration: 2000
    });
  },
  
  // 应用模板数据
  applyTemplate: function(templateData) {
    this.setData({
      principal: templateData.principal || 0,
      fixedInvestment: templateData.fixedInvestment || 0,
      fixedInvestmentType: templateData.fixedInvestmentType || 'monthly',
      annualRate: templateData.annualRate || '0',
      duration: templateData.duration || 0,
      durationType: templateData.durationType || 'month',
      compoundPeriod: templateData.compoundPeriod || 'month'
    });
    // 保存数据
    this.saveData();
    // 重新计算
    this.calculate();
  },

  onShow: function () {
    // 检查去广告状态
    this.checkAdFreeStatus();
    // 启动倒计时更新
    this.startAdFreeCountdown();
    
    // 检查是否有待载入的记录
    const app = getApp();
    if (app.globalData.pendingLoadRecord && app.globalData.pendingLoadRecordType === 'calc') {
      const recordData = app.globalData.pendingLoadRecord;
      // 清除待载入标记
      app.globalData.pendingLoadRecord = null;
      app.globalData.pendingLoadRecordType = null;
      
      // 载入记录数据
      this.loadFromRecord(recordData);
    } else {
      // 更新tabBar选中状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0
        });
      }
    }
  },

  onHide: function() {
    // 页面隐藏时清除倒计时
    if (this.adFreeTimer) {
      clearInterval(this.adFreeTimer);
      this.adFreeTimer = null;
    }
  },

  onUnload: function() {
    // 页面卸载时清除倒计时
    if (this.adFreeTimer) {
      clearInterval(this.adFreeTimer);
      this.adFreeTimer = null;
    }
  },

  // 从收藏记录载入数据
  loadFromRecord: function(recordData) {
    try {
      this.setData({
        principal: parseFloat(recordData.principal) || 0,
        fixedInvestment: parseFloat(recordData.fixedInvestment) || 0,
        fixedInvestmentType: recordData.fixedInvestmentType || 'monthly',
        annualRate: recordData.annualRate || '0',
        duration: parseFloat(recordData.duration) || 0,
        durationType: recordData.durationType || 'month',
        compoundPeriod: recordData.compoundPeriod || 'month'
      });
      // 保存到本地存储
      this.saveData();
      this.calculate();
      
      wx.showToast({
        title: '记录已载入',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.error('载入记录失败:', e);
      wx.showToast({
        title: '载入失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 保存数据到本地存储
  saveData: function() {
    try {
      const dataToSave = {
        principal: this.data.principal,
        fixedInvestment: this.data.fixedInvestment,
        fixedInvestmentType: this.data.fixedInvestmentType,
        annualRate: this.data.annualRate,
        duration: this.data.duration,
        durationType: this.data.durationType,
        compoundPeriod: this.data.compoundPeriod
      };
      wx.setStorageSync('calc_page_data', dataToSave);
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  },

  // 从本地存储加载数据
  loadSavedData: function() {
    try {
      const savedData = wx.getStorageSync('calc_page_data');
      if (savedData) {
        this.setData({
          principal: savedData.principal !== undefined ? savedData.principal : this.data.principal,
          fixedInvestment: savedData.fixedInvestment !== undefined ? savedData.fixedInvestment : this.data.fixedInvestment,
          fixedInvestmentType: savedData.fixedInvestmentType || this.data.fixedInvestmentType,
          annualRate: savedData.annualRate !== undefined ? savedData.annualRate : this.data.annualRate,
          duration: savedData.duration !== undefined ? savedData.duration : this.data.duration,
          durationType: savedData.durationType || this.data.durationType,
          compoundPeriod: savedData.compoundPeriod || this.data.compoundPeriod
        });
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  },

  // 清除保存的数据
  clearSavedData: function() {
    try {
      wx.removeStorageSync('calc_page_data');
      // 恢复默认值
      this.setData({
        principal: 50000,
        fixedInvestment: 2000,
        fixedInvestmentType: 'monthly',
        annualRate: '4.5',
        duration: 36,
        durationType: 'month',
        compoundPeriod: 'month'
      });
      this.calculate();
      wx.showToast({
        title: '已清除历史数据',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.error('清除数据失败:', e);
      wx.showToast({
        title: '清除失败',
        icon: 'none',
        duration: 2000
      });
    }
  },


  // 输入本金
  onPrincipalInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    // 边界值验证
    const bounds = this.data.BOUNDS.principal;
    if (numValue < bounds.min) {
      numValue = bounds.min;
      wx.showToast({
        title: `本金不能小于${bounds.min}元`,
        icon: 'none',
        duration: 2000
      });
    } else if (numValue > bounds.max) {
      numValue = bounds.max;
      wx.showToast({
        title: `本金不能超过${bounds.max}元`,
        icon: 'none',
        duration: 2000
      });
    }
    this.setData({
      principal: numValue
    });
    this.saveData();
    this.calculate();
  },

  // 输入定投金额
  onFixedInvestmentInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    // 边界值验证
    const bounds = this.data.BOUNDS.fixedInvestment;
    if (numValue < bounds.min) {
      numValue = bounds.min;
      wx.showToast({
        title: `定投金额不能小于${bounds.min}元`,
        icon: 'none',
        duration: 2000
      });
    } else if (numValue > bounds.max) {
      numValue = bounds.max;
      wx.showToast({
        title: `定投金额不能超过${bounds.max}元`,
        icon: 'none',
        duration: 2000
      });
    }
    this.setData({
      fixedInvestment: numValue
    });
    this.saveData();
    this.calculate();
  },

  // 切换定投类型
  onFixedInvestmentTypeChange: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      fixedInvestmentType: type
    });
    this.saveData();
    this.calculate();
  },

  // 输入年化收益率
  onAnnualRateInput: function(e) {
    const value = e.detail.value;
    // 验证输入是否为有效的数字格式（允许小数点、负号等）
    // 允许：空字符串、单个小数点、数字、带小数点的数字、负号
    const validPattern = /^-?\.?\d*\.?\d*$/;
    if (value === '' || value === '-' || value === '.' || value === '-.' || validPattern.test(value)) {
      // 如果输入完整，进行边界值验证
      if (value !== '' && value !== '-' && value !== '.' && value !== '-.') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          const bounds = this.data.BOUNDS.annualRate;
          if (numValue < bounds.min) {
            this.setData({
              annualRate: bounds.min.toString()
            });
            this.saveData();
            wx.showToast({
              title: `年化收益率不能小于${bounds.min}%`,
              icon: 'none',
              duration: 2000
            });
            this.calculate();
            return;
          } else if (numValue > bounds.max) {
            this.setData({
              annualRate: bounds.max.toString()
            });
            this.saveData();
            wx.showToast({
              title: `年化收益率不能超过${bounds.max}%`,
              icon: 'none',
              duration: 2000
            });
            this.calculate();
            return;
          }
        }
      }
      this.setData({
        annualRate: value
      });
      this.saveData();
      this.calculate();
    }
  },

  // 输入历时
  onDurationInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    // 根据历时类型获取对应的边界值
    const durationType = this.data.durationType;
    const bounds = this.data.BOUNDS.duration[durationType];
    
    if (numValue < bounds.min) {
      numValue = bounds.min;
      const unit = durationType === 'year' ? '年' : durationType === 'month' ? '月' : '天';
      wx.showToast({
        title: `历时不能小于${bounds.min}${unit}`,
        icon: 'none',
        duration: 2000
      });
    } else if (numValue > bounds.max) {
      numValue = bounds.max;
      const unit = durationType === 'year' ? '年' : durationType === 'month' ? '月' : '天';
      wx.showToast({
        title: `历时不能超过${bounds.max}${unit}`,
        icon: 'none',
        duration: 2000
      });
    }
    this.setData({
      duration: numValue
    });
    this.saveData();
    this.calculate();
  },

  // 切换历时类型
  onDurationTypeChange: function(e) {
    const type = e.currentTarget.dataset.type;
    const currentDuration = this.data.duration;
    const bounds = this.data.BOUNDS.duration[type];
    
    // 切换类型后，检查当前值是否在新类型的边界范围内
    let adjustedDuration = currentDuration;
    if (currentDuration < bounds.min) {
      adjustedDuration = bounds.min;
    } else if (currentDuration > bounds.max) {
      adjustedDuration = bounds.max;
      const unit = type === 'year' ? '年' : type === 'month' ? '月' : '天';
      wx.showToast({
        title: `历时已调整为最大值${bounds.max}${unit}`,
        icon: 'none',
        duration: 2000
      });
    }
    
    this.setData({
      durationType: type,
      duration: adjustedDuration
    });
    this.saveData();
    this.calculate();
  },

  // 切换复利计算周期
  onCompoundPeriodChange: function(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({
      compoundPeriod: period
    });
    this.saveData();
    this.calculate();
  },

  // 格式化数字：如果小数部分为0，则不显示小数点
  formatNumber: function(num) {
    // 先格式化为2位小数
    const formatted = num.toFixed(2);
    // 去掉末尾的0和小数点
    return parseFloat(formatted).toString();
  },

  // 计算
  calculate: function() {
    const {
      principal,
      fixedInvestment,
      fixedInvestmentType,
      annualRate,
      duration,
      durationType,
      compoundPeriod
    } = this.data;

    // 将年化收益率字符串转换为数字
    const annualRateNum = annualRate === '' || annualRate === '.' ? 0 : parseFloat(annualRate) || 0;

    const result = calcUtils.calculateCompoundInterest({
      principal,
      fixedInvestment,
      fixedInvestmentType,
      annualRate: annualRateNum / 100, // 转换为小数
      duration,
      durationType,
      compoundPeriod
    });

    // 生成时间序列数据用于图表
    const chartData = calcUtils.generateTimeSeriesData({
      principal,
      fixedInvestment,
      fixedInvestmentType,
      annualRate: annualRateNum / 100,
      duration,
      durationType,
      compoundPeriod
    });

    this.setData({
      totalInvestment: this.formatNumber(result.totalInvestment),
      finalAssets: this.formatNumber(result.finalAssets),
      finalReturn: this.formatNumber(result.finalReturn),
      totalReturnRate: this.formatNumber(result.totalReturnRate * 100),
      annualizedReturnRate: this.formatNumber(result.annualizedReturnRate * 100),
      chartData: chartData
    });
  },

  // 手动收藏记录
  onSaveRecord: function() {
    const {
      principal,
      fixedInvestment,
      fixedInvestmentType,
      annualRate,
      duration,
      durationType,
      compoundPeriod,
      totalInvestment,
      finalAssets,
      finalReturn,
      totalReturnRate,
      annualizedReturnRate
    } = this.data;

    // 检查是否有有效结果
    if (parseFloat(totalInvestment) <= 0 && parseFloat(finalAssets) <= 0) {
      wx.showToast({
        title: '暂无计算结果',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 弹出输入框让用户输入名称
    wx.showModal({
      title: '收藏记录',
      editable: true,
      placeholderText: '请输入记录名称（可选）',
      success: (res) => {
        if (res.confirm) {
          this.saveRecordWithName(res.content || '');
        }
      }
    });
  },

  // 保存记录（带名称）
  saveRecordWithName: function(name) {
    const {
      principal,
      fixedInvestment,
      fixedInvestmentType,
      annualRate,
      duration,
      durationType,
      compoundPeriod,
      totalInvestment,
      finalAssets,
      finalReturn,
      totalReturnRate,
      annualizedReturnRate
    } = this.data;

    try {
      const historyRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: name || `计算收益_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
        type: 'calc', // 记录类型：计算收益
        // 输入参数
        input: {
          principal: principal,
          fixedInvestment: fixedInvestment,
          fixedInvestmentType: fixedInvestmentType,
          annualRate: annualRate,
          duration: duration,
          durationType: durationType,
          compoundPeriod: compoundPeriod
        },
        // 计算结果
        result: {
          totalInvestment: totalInvestment,
          finalAssets: finalAssets,
          finalReturn: finalReturn,
          totalReturnRate: totalReturnRate,
          annualizedReturnRate: annualizedReturnRate
        }
      };

      // 获取现有历史记录
      let historyList = wx.getStorageSync('calc_history_list') || [];
      
      // 添加到列表开头（最新的在前面）
      historyList.unshift(historyRecord);
      
      // 限制历史记录数量，最多保存100条
      if (historyList.length > 100) {
        historyList = historyList.slice(0, 100);
      }
      
      // 保存到本地存储
      wx.setStorageSync('calc_history_list', historyList);
      
      wx.showToast({
        title: '收藏成功',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.error('收藏记录失败:', e);
      wx.showToast({
        title: '收藏失败',
        icon: 'none',
        duration: 2000
      });
    }
  },



  // 从分享数据载入
  loadFromShareData: function(shareData) {
    try {
      this.setData({
        principal: parseFloat(shareData.principal) || 0,
        fixedInvestment: parseFloat(shareData.fixedInvestment) || 0,
        fixedInvestmentType: shareData.fixedInvestmentType || 'monthly',
        annualRate: shareData.annualRate || '0',
        duration: parseFloat(shareData.duration) || 0,
        durationType: shareData.durationType || 'month',
        compoundPeriod: shareData.compoundPeriod || 'month'
      });
      // 保存到本地存储
      this.saveData();
      this.calculate();
      
      wx.showToast({
        title: '已载入分享数据',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.error('载入分享数据失败:', e);
      // 如果载入失败，使用默认数据
      this.loadSavedData();
      this.calculate();
    }
  },

  // 分享到微信好友/群
  onShareAppMessage: function() {
    const {
      principal,
      fixedInvestment,
      fixedInvestmentType,
      annualRate,
      duration,
      durationType,
      compoundPeriod,
      totalInvestment,
      finalAssets,
      finalReturn,
      totalReturnRate,
      annualizedReturnRate
    } = this.data;

    // 检查是否有有效结果
    if (parseFloat(totalInvestment) <= 0 && parseFloat(finalAssets) <= 0) {
      return {
        title: '复利计算收益结果',
        path: '/pages/calc/index'
      };
    }

    // 构建分享数据，用于打开后自动填充
    const shareData = {
      principal: principal,
      fixedInvestment: fixedInvestment,
      fixedInvestmentType: fixedInvestmentType,
      annualRate: annualRate,
      duration: duration,
      durationType: durationType,
      compoundPeriod: compoundPeriod
    };

    // 构建分享标题
    const fixedInvestmentText = fixedInvestmentType === 'yearly' ? '每年' : '每月';
    const durationUnit = durationType === 'year' ? '年' : durationType === 'month' ? '月' : '天';
    
    let shareTitle = `复利计算：本金${principal}元，${fixedInvestmentText}定投${fixedInvestment}元，年化${annualRate}%，历时${duration}${durationUnit}`;
    if (shareTitle.length > 30) {
      shareTitle = `复利计算：最终资产${finalAssets}元，收益${finalReturn}元`;
    }

    return {
      title: shareTitle,
      path: `/pages/calc/index?share=true&data=${encodeURIComponent(JSON.stringify(shareData))}`,
      imageUrl: '' // 可以设置分享图片
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    const {
      principal,
      fixedInvestment,
      fixedInvestmentType,
      annualRate,
      duration,
      durationType,
      compoundPeriod,
      totalInvestment,
      finalAssets,
      finalReturn,
      totalReturnRate,
      annualizedReturnRate
    } = this.data;

    // 检查是否有有效结果
    if (parseFloat(totalInvestment) <= 0 && parseFloat(finalAssets) <= 0) {
      return {
        title: '复利计算收益结果 - 极简复利计算器',
        query: ''
      };
    }

    // 构建分享数据，用于打开后自动填充
    const shareData = {
      principal: principal,
      fixedInvestment: fixedInvestment,
      fixedInvestmentType: fixedInvestmentType,
      annualRate: annualRate,
      duration: duration,
      durationType: durationType,
      compoundPeriod: compoundPeriod
    };

    // 构建分享标题（朋友圈标题可以更长）
    const fixedInvestmentText = fixedInvestmentType === 'yearly' ? '每年' : '每月';
    const durationUnit = durationType === 'year' ? '年' : durationType === 'month' ? '月' : '天';
    
    let shareTitle = `复利计算：本金${principal}元，${fixedInvestmentText}定投${fixedInvestment}元，年化${annualRate}%，历时${duration}${durationUnit}。最终资产${finalAssets}元，收益${finalReturn}元，年化收益率${annualizedReturnRate}%`;

    return {
      title: shareTitle,
      query: `share=true&data=${encodeURIComponent(JSON.stringify(shareData))}`,
      imageUrl: '' // 可以设置分享图片
    };
  },

  // 长按分享按钮清除数据
  onShareLongPress: function() {
    wx.showModal({
      title: '清除数据',
      content: '确定要清除保存的输入数据吗？',
      success: (res) => {
        if (res.confirm) {
          this.clearSavedData();
        }
      }
    });
  },

  // 检查去广告状态
  checkAdFreeStatus: function() {
    const app = getApp();
    app.checkAdFreeStatus();
    const isActive = app.globalData.isAdFree;
    this.setData({
      isAdFreeActive: isActive
    });
    if (isActive) {
      this.updateRemainingTime();
    }
  },

  // 更新剩余时间显示
  updateRemainingTime: function() {
    const app = getApp();
    const remaining = app.getRemainingTime();
    
    if (remaining <= 0) {
      // 已过期
      this.setData({
        isAdFreeActive: false,
        remainingTimeText: ''
      });
      app.checkAdFreeStatus();
      if (this.adFreeTimer) {
        clearInterval(this.adFreeTimer);
        this.adFreeTimer = null;
      }
      return;
    }

    // 格式化剩余时间
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    
    let timeText = '';
    if (hours > 0) {
      timeText = `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      timeText = `${minutes}分钟${seconds}秒`;
    } else {
      timeText = `${seconds}秒`;
    }

    this.setData({
      remainingTimeText: timeText
    });
  },

  // 启动倒计时更新
  startAdFreeCountdown: function() {
    // 清除之前的定时器
    if (this.adFreeTimer) {
      clearInterval(this.adFreeTimer);
    }
    
    // 立即更新一次
    this.updateRemainingTime();
    
    // 每秒更新一次
    this.adFreeTimer = setInterval(() => {
      this.updateRemainingTime();
    }, 1000);
  },

  // 观看广告
  onWatchAd: function() {
    const app = getApp();
    
    // 检查是否已有有效的去广告状态
    if (app.globalData.isAdFree) {
      wx.showToast({
        title: '您已享受去广告服务',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 显示确认对话框
    wx.showModal({
      title: '观看视频去广告',
      content: '观看完整视频后，将获得24小时去广告体验，是否继续？',
      confirmText: '观看',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.watchRewardVideoAd();
        }
      }
    });
  },

  // 观看激励视频广告（占位符实现）
  watchRewardVideoAd: function() {
    // TODO: 这里应该调用微信小程序的激励视频广告API
    // 示例代码（需要替换为实际的广告API调用）：
    /*
    const videoAd = wx.createRewardedVideoAd({
      adUnitId: 'your-ad-unit-id'
    });
    
    videoAd.onLoad(() => {
      console.log('激励视频广告加载成功');
    });
    
    videoAd.onError((err) => {
      console.error('激励视频广告加载失败', err);
      wx.showToast({
        title: '广告加载失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
    });
    
    videoAd.onClose((res) => {
      if (res && res.isEnded) {
        // 用户完整观看了视频
        this.onAdReward();
      } else {
        // 用户提前关闭了视频
        wx.showToast({
          title: '需要完整观看视频才能获得奖励',
          icon: 'none',
          duration: 2000
        });
      }
    });
    
    videoAd.show().catch(() => {
      // 失败则重新加载
      videoAd.load()
        .then(() => videoAd.show())
        .catch(err => {
          console.error('激励视频广告显示失败', err);
          wx.showToast({
            title: '广告加载失败，请稍后重试',
            icon: 'none',
            duration: 2000
          });
        });
    });
    */

    // 占位符：模拟观看广告成功
    // 实际使用时应该删除这段代码，使用上面的真实广告API
    wx.showLoading({
      title: '加载广告中...',
      mask: true
    });
    
    // 模拟广告加载和观看过程
    setTimeout(() => {
      wx.hideLoading();
      // 模拟用户完整观看
      this.onAdReward();
    }, 2000);
  },

  // 广告奖励回调
  onAdReward: function() {
    const app = getApp();
    app.setAdFree();
    
    this.setData({
      isAdFreeActive: true
    });
    
    // 启动倒计时
    this.startAdFreeCountdown();
    
    wx.showToast({
      title: '已获得24小时去广告体验',
      icon: 'success',
      duration: 2000
    });
  }
});

