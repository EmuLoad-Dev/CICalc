// pages/savings/index.js
const calcUtils = require('../../utils/calc.js');

Page({
  data: {
    // 输入字段
    currentDeposit: 10000, // 当前存款（默认1万元）
    targetDeposit: 200000, // 目标存款（默认20万元）
    expectedAnnualRate: '3.5', // 预期年化收益率（默认3.5%，使用字符串以支持小数点输入）
    depositDuration: 36, // 存款时长（默认36个月，即3年）
    durationType: 'month', // 存款时长类型：year/month/day
    
    // 计算结果
    totalInvestment: 0, // 总投资额
    finalAssets: 0, // 最终资产
    finalReturn: 0, // 最终收益
    totalReturnRate: 0, // 总收益率
    monthlyDeposit: 0, // 每月存入
    
    // 图表数据
    chartData: [],
    
    // 边界值常量
    BOUNDS: {
      currentDeposit: { min: 0, max: 10000000000 }, // 当前存款：0 - 100亿
      targetDeposit: { min: 0, max: 10000000000 }, // 目标存款：0 - 100亿
      expectedAnnualRate: { min: -100, max: 1000 }, // 预期年化收益率：-100% - 1000%
      depositDuration: {
        year: { min: 0, max: 100 }, // 年：0 - 100年
        month: { min: 0, max: 1200 }, // 月：0 - 1200个月（100年）
        day: { min: 0, max: 36500 } // 天：0 - 36500天（100年）
      }
    }
  },

  onLoad: function () {
    // 恢复保存的数据
    this.loadSavedData();
    this.calculate();
  },

  onShow: function () {
    // 检查是否有待载入的记录
    const app = getApp();
    if (app.globalData.pendingLoadRecord && app.globalData.pendingLoadRecordType === 'savings') {
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
          selected: 1
        });
      }
    }
  },

  // 从收藏记录载入数据
  loadFromRecord: function(recordData) {
    try {
      this.setData({
        currentDeposit: parseFloat(recordData.currentDeposit) || 0,
        targetDeposit: parseFloat(recordData.targetDeposit) || 0,
        expectedAnnualRate: recordData.expectedAnnualRate || '0',
        depositDuration: parseFloat(recordData.depositDuration) || 0,
        durationType: recordData.durationType || 'month'
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
        currentDeposit: this.data.currentDeposit,
        targetDeposit: this.data.targetDeposit,
        expectedAnnualRate: this.data.expectedAnnualRate,
        depositDuration: this.data.depositDuration,
        durationType: this.data.durationType
      };
      wx.setStorageSync('savings_page_data', dataToSave);
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  },

  // 从本地存储加载数据
  loadSavedData: function() {
    try {
      const savedData = wx.getStorageSync('savings_page_data');
      if (savedData) {
        this.setData({
          currentDeposit: savedData.currentDeposit !== undefined ? savedData.currentDeposit : this.data.currentDeposit,
          targetDeposit: savedData.targetDeposit !== undefined ? savedData.targetDeposit : this.data.targetDeposit,
          expectedAnnualRate: savedData.expectedAnnualRate !== undefined ? savedData.expectedAnnualRate : this.data.expectedAnnualRate,
          depositDuration: savedData.depositDuration !== undefined ? savedData.depositDuration : this.data.depositDuration,
          durationType: savedData.durationType || this.data.durationType
        });
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  },

  // 清除保存的数据
  clearSavedData: function() {
    try {
      wx.removeStorageSync('savings_page_data');
      // 恢复默认值
      this.setData({
        currentDeposit: 10000,
        targetDeposit: 200000,
        expectedAnnualRate: '3.5',
        depositDuration: 36,
        durationType: 'month'
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


  // 输入当前存款
  onCurrentDepositInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    // 边界值验证
    const bounds = this.data.BOUNDS.currentDeposit;
    if (numValue < bounds.min) {
      numValue = bounds.min;
      wx.showToast({
        title: `当前存款不能小于${bounds.min}元`,
        icon: 'none',
        duration: 2000
      });
    } else if (numValue > bounds.max) {
      numValue = bounds.max;
      wx.showToast({
        title: `当前存款不能超过${bounds.max}元`,
        icon: 'none',
        duration: 2000
      });
    }
    this.setData({
      currentDeposit: numValue
    });
    this.saveData();
    this.calculate();
  },

  // 输入目标存款
  onTargetDepositInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    // 边界值验证
    const bounds = this.data.BOUNDS.targetDeposit;
    if (numValue < bounds.min) {
      numValue = bounds.min;
      wx.showToast({
        title: `目标存款不能小于${bounds.min}元`,
        icon: 'none',
        duration: 2000
      });
    } else if (numValue > bounds.max) {
      numValue = bounds.max;
      wx.showToast({
        title: `目标存款不能超过${bounds.max}元`,
        icon: 'none',
        duration: 2000
      });
    }
    this.setData({
      targetDeposit: numValue
    });
    this.saveData();
    this.calculate();
  },

  // 输入预期年化收益率
  onExpectedAnnualRateInput: function(e) {
    const value = e.detail.value;
    // 验证输入是否为有效的数字格式（允许小数点、负号等）
    // 允许：空字符串、单个小数点、数字、带小数点的数字、负号
    const validPattern = /^-?\.?\d*\.?\d*$/;
    if (value === '' || value === '-' || value === '.' || value === '-.' || validPattern.test(value)) {
      // 如果输入完整，进行边界值验证
      if (value !== '' && value !== '-' && value !== '.' && value !== '-.') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          const bounds = this.data.BOUNDS.expectedAnnualRate;
          if (numValue < bounds.min) {
            this.setData({
              expectedAnnualRate: bounds.min.toString()
            });
            this.saveData();
            wx.showToast({
              title: `预期年化收益率不能小于${bounds.min}%`,
              icon: 'none',
              duration: 2000
            });
            this.calculate();
            return;
          } else if (numValue > bounds.max) {
            this.setData({
              expectedAnnualRate: bounds.max.toString()
            });
            this.saveData();
            wx.showToast({
              title: `预期年化收益率不能超过${bounds.max}%`,
              icon: 'none',
              duration: 2000
            });
            this.calculate();
            return;
          }
        }
      }
      this.setData({
        expectedAnnualRate: value
      });
      this.saveData();
      this.calculate();
    }
  },

  // 输入存款时长
  onDepositDurationInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    // 根据存款时长类型获取对应的边界值
    const durationType = this.data.durationType;
    const bounds = this.data.BOUNDS.depositDuration[durationType];
    
    if (numValue < bounds.min) {
      numValue = bounds.min;
      const unit = durationType === 'year' ? '年' : durationType === 'month' ? '月' : '天';
      wx.showToast({
        title: `存款时长不能小于${bounds.min}${unit}`,
        icon: 'none',
        duration: 2000
      });
    } else if (numValue > bounds.max) {
      numValue = bounds.max;
      const unit = durationType === 'year' ? '年' : durationType === 'month' ? '月' : '天';
      wx.showToast({
        title: `存款时长不能超过${bounds.max}${unit}`,
        icon: 'none',
        duration: 2000
      });
    }
    this.setData({
      depositDuration: numValue
    });
    this.saveData();
    this.calculate();
  },

  // 切换存款时长类型
  onDurationTypeChange: function(e) {
    const type = e.currentTarget.dataset.type;
    const currentDuration = this.data.depositDuration;
    const bounds = this.data.BOUNDS.depositDuration[type];
    
    // 切换类型后，检查当前值是否在新类型的边界范围内
    let adjustedDuration = currentDuration;
    if (currentDuration < bounds.min) {
      adjustedDuration = bounds.min;
    } else if (currentDuration > bounds.max) {
      adjustedDuration = bounds.max;
      const unit = type === 'year' ? '年' : type === 'month' ? '月' : '天';
      wx.showToast({
        title: `存款时长已调整为最大值${bounds.max}${unit}`,
        icon: 'none',
        duration: 2000
      });
    }
    
    this.setData({
      durationType: type,
      depositDuration: adjustedDuration
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
      currentDeposit,
      targetDeposit,
      expectedAnnualRate,
      depositDuration,
      durationType
    } = this.data;

    // 将年化收益率字符串转换为数字
    const annualRateNum = expectedAnnualRate === '' || expectedAnnualRate === '.' ? 0 : parseFloat(expectedAnnualRate) || 0;

    // 将存款时长统一转换为月数
    let totalMonths = 0;
    if (durationType === 'year') {
      totalMonths = depositDuration * 12;
    } else if (durationType === 'month') {
      totalMonths = depositDuration;
    } else {
      totalMonths = depositDuration / 30; // 天数转月数
    }

    if (totalMonths <= 0 || annualRateNum <= 0) {
      this.setData({
        monthlyDeposit: 0,
        totalInvestment: this.formatNumber(currentDeposit),
        finalAssets: this.formatNumber(currentDeposit),
        finalReturn: 0,
        totalReturnRate: 0
      });
      return;
    }

    // 计算每月需要存入的金额
    // 使用复利公式反推：FV = PV * (1+r)^n + PMT * (((1+r)^n - 1) / r)
    // 其中 FV = targetDeposit, PV = currentDeposit, r = monthlyRate, n = totalMonths
    const monthlyRate = annualRateNum / 100 / 12;
    const months = totalMonths;
    
    const futureValueOfCurrent = currentDeposit * Math.pow(1 + monthlyRate, months);
    const remainingNeeded = targetDeposit - futureValueOfCurrent;
    
    let monthlyDeposit = 0;
    if (remainingNeeded > 0) {
      const annuityFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
      monthlyDeposit = remainingNeeded / annuityFactor;
    } else if (remainingNeeded < 0) {
      // 如果当前存款的复利已经超过目标，则不需要每月存入
      monthlyDeposit = 0;
    }

    // 计算最终结果
    const totalInvestment = currentDeposit + monthlyDeposit * months;
    const finalAssets = targetDeposit;
    const finalReturn = finalAssets - totalInvestment;
    const totalReturnRate = totalInvestment > 0 ? (finalReturn / totalInvestment) : 0;

    // 生成时间序列数据用于图表
    const chartData = calcUtils.generateSavingsTimeSeriesData({
      currentDeposit,
      targetDeposit,
      expectedAnnualRate: annualRateNum / 100, // 转换为小数
      depositDuration,
      durationType
    });

    this.setData({
      monthlyDeposit: this.formatNumber(monthlyDeposit),
      totalInvestment: this.formatNumber(totalInvestment),
      finalAssets: this.formatNumber(finalAssets),
      finalReturn: this.formatNumber(finalReturn),
      totalReturnRate: this.formatNumber(totalReturnRate * 100),
      chartData: chartData
    });
  },

  // 手动收藏记录
  onSaveRecord: function() {
    const {
      currentDeposit,
      targetDeposit,
      expectedAnnualRate,
      depositDuration,
      durationType,
      monthlyDeposit,
      totalInvestment,
      finalAssets,
      finalReturn,
      totalReturnRate
    } = this.data;

    // 检查是否有有效结果
    if (parseFloat(monthlyDeposit) <= 0 && parseFloat(totalInvestment) <= 0) {
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
      currentDeposit,
      targetDeposit,
      expectedAnnualRate,
      depositDuration,
      durationType,
      monthlyDeposit,
      totalInvestment,
      finalAssets,
      finalReturn,
      totalReturnRate
    } = this.data;

    try {
      const historyRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: name || `存钱计划_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
        type: 'savings', // 记录类型：存钱计划
        // 输入参数
        input: {
          currentDeposit: currentDeposit,
          targetDeposit: targetDeposit,
          expectedAnnualRate: expectedAnnualRate,
          depositDuration: depositDuration,
          durationType: durationType
        },
        // 计算结果
        result: {
          monthlyDeposit: monthlyDeposit,
          totalInvestment: totalInvestment,
          finalAssets: finalAssets,
          finalReturn: finalReturn,
          totalReturnRate: totalReturnRate
        }
      };

      // 获取现有历史记录
      let historyList = wx.getStorageSync('savings_history_list') || [];
      
      // 添加到列表开头（最新的在前面）
      historyList.unshift(historyRecord);
      
      // 限制历史记录数量，最多保存100条
      if (historyList.length > 100) {
        historyList = historyList.slice(0, 100);
      }
      
      // 保存到本地存储
      wx.setStorageSync('savings_history_list', historyList);
      
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


  // 分享计算结果
  onShare: function() {
    wx.showToast({
      title: '分享功能待实现',
      icon: 'none'
    });
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
  }
});
