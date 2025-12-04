// pages/home/index.js
const calcUtils = require('../../utils/calc.js');

Page({
  data: {
    // Segment控制器
    currentSegment: 0, // 0: 计算收益, 1: 存钱计划, 2: 计算年化
    
    // 计算收益页面数据
    calcData: {
      principal: 50000,
      fixedInvestment: 2000,
      fixedInvestmentType: 'monthly',
      annualRate: '4.5',
      duration: 36,
      durationType: 'month',
      compoundPeriod: 'month',
      totalInvestment: 0,
      finalAssets: 0,
      finalReturn: 0,
      totalReturnRate: 0,
      annualizedReturnRate: 0,
      chartData: []
    },
    
    // 存钱计划页面数据
    savingsData: {
      currentDeposit: 10000,
      targetDeposit: 200000,
      expectedAnnualRate: '3.5',
      depositDuration: 36,
      durationType: 'month',
      totalInvestment: 0,
      finalAssets: 0,
      finalReturn: 0,
      totalReturnRate: 0,
      monthlyDeposit: 0,
      chartData: []
    },
    
    // 计算年化页面数据
    annualData: {
      principal: 100000,
      finalAmount: 120000,
      duration: 3,
      durationType: 'year',
      annualizedRate: 0,
      totalReturn: 0,
      totalReturnRate: 0,
      chartData: []
    },
    
    // 去广告状态
    isAdFreeActive: false,
    remainingTimeText: '',
    
    // 边界值常量
    BOUNDS: {
      principal: { min: 0, max: 10000000000 },
      fixedInvestment: { min: 0, max: 100000000 },
      annualRate: { min: -100, max: 1000 },
      currentDeposit: { min: 0, max: 10000000000 },
      targetDeposit: { min: 0, max: 10000000000 },
      expectedAnnualRate: { min: -100, max: 1000 },
      finalAmount: { min: 0, max: 10000000000 },
      duration: {
        year: { min: 0, max: 100 },
        month: { min: 0, max: 1200 },
        day: { min: 0, max: 36500 }
      },
      depositDuration: {
        year: { min: 0, max: 100 },
        month: { min: 0, max: 1200 },
        day: { min: 0, max: 36500 }
      }
    }
  },

  onLoad: function (options) {
    // 检查是否有分享参数
    if (options.share === 'true' && options.data) {
      try {
        const shareData = JSON.parse(decodeURIComponent(options.data));
        this.shareData = shareData;
        wx.showModal({
          title: '载入分享数据',
          content: '检测到分享的计算数据，是否载入？',
          confirmText: '载入',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.loadFromShareData(this.shareData);
            } else {
              this.loadAllSavedData();
              this.calculateAll();
            }
          },
          fail: () => {
            this.loadAllSavedData();
            this.calculateAll();
          }
        });
        return;
      } catch (e) {
        console.error('解析分享数据失败:', e);
      }
    }
    
    this.loadAllSavedData();
    this.calculateAll();
  },

  onShow: function () {
    // 检查去广告状态
    this.checkAdFreeStatus();
    this.startAdFreeCountdown();
    
    // 检查是否有待载入的记录
    const app = getApp();
    if (app.globalData.pendingLoadRecord) {
      const recordData = app.globalData.pendingLoadRecord;
      const recordType = app.globalData.pendingLoadRecordType;
      app.globalData.pendingLoadRecord = null;
      app.globalData.pendingLoadRecordType = null;
      
      // 根据记录类型切换到对应segment并载入数据
      if (recordType === 'calc') {
        this.setData({ currentSegment: 0 });
        this.loadCalcFromRecord(recordData);
      } else if (recordType === 'savings') {
        this.setData({ currentSegment: 1 });
        this.loadSavingsFromRecord(recordData);
      } else if (recordType === 'annual') {
        this.setData({ currentSegment: 2 });
        this.loadAnnualFromRecord(recordData);
      }
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
    if (this.adFreeTimer) {
      clearInterval(this.adFreeTimer);
      this.adFreeTimer = null;
    }
  },

  onUnload: function() {
    if (this.adFreeTimer) {
      clearInterval(this.adFreeTimer);
      this.adFreeTimer = null;
    }
  },

  // Segment切换
  onSegmentChange: function(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      currentSegment: index
    });
  },

  // ========== 计算收益页面方法 ==========
  
  onCalcPrincipalInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const bounds = this.data.BOUNDS.principal;
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'calcData.principal': numValue
    });
    this.saveCalcData();
    this.calculateCalc();
  },

  onCalcFixedInvestmentInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const bounds = this.data.BOUNDS.fixedInvestment;
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'calcData.fixedInvestment': numValue
    });
    this.saveCalcData();
    this.calculateCalc();
  },

  onCalcFixedInvestmentTypeChange: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'calcData.fixedInvestmentType': type
    });
    this.saveCalcData();
    this.calculateCalc();
  },

  onCalcAnnualRateInput: function(e) {
    const value = e.detail.value;
    const validPattern = /^-?\.?\d*\.?\d*$/;
    if (value === '' || value === '-' || value === '.' || value === '-.' || validPattern.test(value)) {
      if (value !== '' && value !== '-' && value !== '.' && value !== '-.') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          const bounds = this.data.BOUNDS.annualRate;
          if (numValue < bounds.min || numValue > bounds.max) {
            this.setData({
              'calcData.annualRate': numValue < bounds.min ? bounds.min.toString() : bounds.max.toString()
            });
            this.saveCalcData();
            this.calculateCalc();
            return;
          }
        }
      }
      this.setData({
        'calcData.annualRate': value
      });
      this.saveCalcData();
      this.calculateCalc();
    }
  },

  onCalcDurationInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const durationType = this.data.calcData.durationType;
    const bounds = this.data.BOUNDS.duration[durationType];
    
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'calcData.duration': numValue
    });
    this.saveCalcData();
    this.calculateCalc();
  },

  onCalcDurationTypeChange: function(e) {
    const type = e.currentTarget.dataset.type;
    const currentDuration = this.data.calcData.duration;
    const bounds = this.data.BOUNDS.duration[type];
    
    let adjustedDuration = currentDuration;
    if (currentDuration < bounds.min) adjustedDuration = bounds.min;
    else if (currentDuration > bounds.max) adjustedDuration = bounds.max;
    
    this.setData({
      'calcData.durationType': type,
      'calcData.duration': adjustedDuration
    });
    this.saveCalcData();
    this.calculateCalc();
  },

  onCalcCompoundPeriodChange: function(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({
      'calcData.compoundPeriod': period
    });
    this.saveCalcData();
    this.calculateCalc();
  },

  calculateCalc: function() {
    const calcData = this.data.calcData;
    const annualRateNum = calcData.annualRate === '' || calcData.annualRate === '.' ? 0 : parseFloat(calcData.annualRate) || 0;

    const result = calcUtils.calculateCompoundInterest({
      principal: calcData.principal,
      fixedInvestment: calcData.fixedInvestment,
      fixedInvestmentType: calcData.fixedInvestmentType,
      annualRate: annualRateNum / 100,
      duration: calcData.duration,
      durationType: calcData.durationType,
      compoundPeriod: calcData.compoundPeriod
    });

    const chartData = calcUtils.generateTimeSeriesData({
      principal: calcData.principal,
      fixedInvestment: calcData.fixedInvestment,
      fixedInvestmentType: calcData.fixedInvestmentType,
      annualRate: annualRateNum / 100,
      duration: calcData.duration,
      durationType: calcData.durationType,
      compoundPeriod: calcData.compoundPeriod
    });

    this.setData({
      'calcData.totalInvestment': this.formatNumber(result.totalInvestment),
      'calcData.finalAssets': this.formatNumber(result.finalAssets),
      'calcData.finalReturn': this.formatNumber(result.finalReturn),
      'calcData.totalReturnRate': this.formatNumber(result.totalReturnRate * 100),
      'calcData.annualizedReturnRate': this.formatNumber(result.annualizedReturnRate * 100),
      'calcData.chartData': chartData
    });
  },

  onCalcSaveRecord: function() {
    const calcData = this.data.calcData;
    if (parseFloat(calcData.totalInvestment) <= 0 && parseFloat(calcData.finalAssets) <= 0) {
      wx.showToast({
        title: '暂无计算结果',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '收藏记录',
      editable: true,
      placeholderText: '请输入记录名称（可选）',
      success: (res) => {
        if (res.confirm) {
          this.saveCalcRecordWithName(res.content || '');
        }
      }
    });
  },

  saveCalcRecordWithName: function(name) {
    const calcData = this.data.calcData;
    try {
      const historyRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: name || `计算收益_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
        type: 'calc',
        input: {
          principal: calcData.principal,
          fixedInvestment: calcData.fixedInvestment,
          fixedInvestmentType: calcData.fixedInvestmentType,
          annualRate: calcData.annualRate,
          duration: calcData.duration,
          durationType: calcData.durationType,
          compoundPeriod: calcData.compoundPeriod
        },
        result: {
          totalInvestment: calcData.totalInvestment,
          finalAssets: calcData.finalAssets,
          finalReturn: calcData.finalReturn,
          totalReturnRate: calcData.totalReturnRate,
          annualizedReturnRate: calcData.annualizedReturnRate
        }
      };

      let historyList = wx.getStorageSync('calc_history_list') || [];
      historyList.unshift(historyRecord);
      if (historyList.length > 100) {
        historyList = historyList.slice(0, 100);
      }
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

  loadCalcFromRecord: function(recordData) {
    try {
      this.setData({
        'calcData.principal': parseFloat(recordData.principal) || 0,
        'calcData.fixedInvestment': parseFloat(recordData.fixedInvestment) || 0,
        'calcData.fixedInvestmentType': recordData.fixedInvestmentType || 'monthly',
        'calcData.annualRate': recordData.annualRate || '0',
        'calcData.duration': parseFloat(recordData.duration) || 0,
        'calcData.durationType': recordData.durationType || 'month',
        'calcData.compoundPeriod': recordData.compoundPeriod || 'month'
      });
      this.saveCalcData();
      this.calculateCalc();
      
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

  saveCalcData: function() {
    try {
      const dataToSave = {
        principal: this.data.calcData.principal,
        fixedInvestment: this.data.calcData.fixedInvestment,
        fixedInvestmentType: this.data.calcData.fixedInvestmentType,
        annualRate: this.data.calcData.annualRate,
        duration: this.data.calcData.duration,
        durationType: this.data.calcData.durationType,
        compoundPeriod: this.data.calcData.compoundPeriod
      };
      wx.setStorageSync('calc_page_data', dataToSave);
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  },

  loadCalcData: function() {
    try {
      const savedData = wx.getStorageSync('calc_page_data');
      if (savedData) {
        this.setData({
          'calcData.principal': savedData.principal !== undefined ? savedData.principal : this.data.calcData.principal,
          'calcData.fixedInvestment': savedData.fixedInvestment !== undefined ? savedData.fixedInvestment : this.data.calcData.fixedInvestment,
          'calcData.fixedInvestmentType': savedData.fixedInvestmentType || this.data.calcData.fixedInvestmentType,
          'calcData.annualRate': savedData.annualRate !== undefined ? savedData.annualRate : this.data.calcData.annualRate,
          'calcData.duration': savedData.duration !== undefined ? savedData.duration : this.data.calcData.duration,
          'calcData.durationType': savedData.durationType || this.data.calcData.durationType,
          'calcData.compoundPeriod': savedData.compoundPeriod || this.data.calcData.compoundPeriod
        });
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  },

  // ========== 存钱计划页面方法 ==========
  
  onSavingsCurrentDepositInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const bounds = this.data.BOUNDS.currentDeposit;
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'savingsData.currentDeposit': numValue
    });
    this.saveSavingsData();
    this.calculateSavings();
  },

  onSavingsTargetDepositInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const bounds = this.data.BOUNDS.targetDeposit;
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'savingsData.targetDeposit': numValue
    });
    this.saveSavingsData();
    this.calculateSavings();
  },

  onSavingsExpectedAnnualRateInput: function(e) {
    const value = e.detail.value;
    const validPattern = /^-?\.?\d*\.?\d*$/;
    if (value === '' || value === '-' || value === '.' || value === '-.' || validPattern.test(value)) {
      if (value !== '' && value !== '-' && value !== '.' && value !== '-.') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          const bounds = this.data.BOUNDS.expectedAnnualRate;
          if (numValue < bounds.min || numValue > bounds.max) {
            this.setData({
              'savingsData.expectedAnnualRate': numValue < bounds.min ? bounds.min.toString() : bounds.max.toString()
            });
            this.saveSavingsData();
            this.calculateSavings();
            return;
          }
        }
      }
      this.setData({
        'savingsData.expectedAnnualRate': value
      });
      this.saveSavingsData();
      this.calculateSavings();
    }
  },

  onSavingsDepositDurationInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const durationType = this.data.savingsData.durationType;
    const bounds = this.data.BOUNDS.depositDuration[durationType];
    
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'savingsData.depositDuration': numValue
    });
    this.saveSavingsData();
    this.calculateSavings();
  },

  onSavingsDurationTypeChange: function(e) {
    const type = e.currentTarget.dataset.type;
    const currentDuration = this.data.savingsData.depositDuration;
    const bounds = this.data.BOUNDS.depositDuration[type];
    
    let adjustedDuration = currentDuration;
    if (currentDuration < bounds.min) adjustedDuration = bounds.min;
    else if (currentDuration > bounds.max) adjustedDuration = bounds.max;
    
    this.setData({
      'savingsData.durationType': type,
      'savingsData.depositDuration': adjustedDuration
    });
    this.saveSavingsData();
    this.calculateSavings();
  },

  calculateSavings: function() {
    const savingsData = this.data.savingsData;
    const annualRateNum = savingsData.expectedAnnualRate === '' || savingsData.expectedAnnualRate === '.' ? 0 : parseFloat(savingsData.expectedAnnualRate) || 0;

    let totalMonths = 0;
    if (savingsData.durationType === 'year') {
      totalMonths = savingsData.depositDuration * 12;
    } else if (savingsData.durationType === 'month') {
      totalMonths = savingsData.depositDuration;
    } else {
      totalMonths = savingsData.depositDuration / 30;
    }

    if (totalMonths <= 0 || annualRateNum <= 0) {
      this.setData({
        'savingsData.monthlyDeposit': 0,
        'savingsData.totalInvestment': this.formatNumber(savingsData.currentDeposit),
        'savingsData.finalAssets': this.formatNumber(savingsData.currentDeposit),
        'savingsData.finalReturn': 0,
        'savingsData.totalReturnRate': 0
      });
      return;
    }

    const monthlyRate = annualRateNum / 100 / 12;
    const months = totalMonths;
    
    const futureValueOfCurrent = savingsData.currentDeposit * Math.pow(1 + monthlyRate, months);
    const remainingNeeded = savingsData.targetDeposit - futureValueOfCurrent;
    
    let monthlyDeposit = 0;
    if (remainingNeeded > 0) {
      const annuityFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
      monthlyDeposit = remainingNeeded / annuityFactor;
    }

    const totalInvestment = savingsData.currentDeposit + monthlyDeposit * months;
    const finalAssets = savingsData.targetDeposit;
    const finalReturn = finalAssets - totalInvestment;
    const totalReturnRate = totalInvestment > 0 ? (finalReturn / totalInvestment) : 0;

    const chartData = calcUtils.generateSavingsTimeSeriesData({
      currentDeposit: savingsData.currentDeposit,
      targetDeposit: savingsData.targetDeposit,
      expectedAnnualRate: annualRateNum / 100,
      depositDuration: savingsData.depositDuration,
      durationType: savingsData.durationType
    });

    this.setData({
      'savingsData.monthlyDeposit': this.formatNumber(monthlyDeposit),
      'savingsData.totalInvestment': this.formatNumber(totalInvestment),
      'savingsData.finalAssets': this.formatNumber(finalAssets),
      'savingsData.finalReturn': this.formatNumber(finalReturn),
      'savingsData.totalReturnRate': this.formatNumber(totalReturnRate * 100),
      'savingsData.chartData': chartData
    });
  },

  onSavingsSaveRecord: function() {
    const savingsData = this.data.savingsData;
    if (parseFloat(savingsData.monthlyDeposit) <= 0 && parseFloat(savingsData.totalInvestment) <= 0) {
      wx.showToast({
        title: '暂无计算结果',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '收藏记录',
      editable: true,
      placeholderText: '请输入记录名称（可选）',
      success: (res) => {
        if (res.confirm) {
          this.saveSavingsRecordWithName(res.content || '');
        }
      }
    });
  },

  saveSavingsRecordWithName: function(name) {
    const savingsData = this.data.savingsData;
    try {
      const historyRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: name || `存钱计划_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
        type: 'savings',
        input: {
          currentDeposit: savingsData.currentDeposit,
          targetDeposit: savingsData.targetDeposit,
          expectedAnnualRate: savingsData.expectedAnnualRate,
          depositDuration: savingsData.depositDuration,
          durationType: savingsData.durationType
        },
        result: {
          monthlyDeposit: savingsData.monthlyDeposit,
          totalInvestment: savingsData.totalInvestment,
          finalAssets: savingsData.finalAssets,
          finalReturn: savingsData.finalReturn,
          totalReturnRate: savingsData.totalReturnRate
        }
      };

      let historyList = wx.getStorageSync('savings_history_list') || [];
      historyList.unshift(historyRecord);
      if (historyList.length > 100) {
        historyList = historyList.slice(0, 100);
      }
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

  loadSavingsFromRecord: function(recordData) {
    try {
      this.setData({
        'savingsData.currentDeposit': parseFloat(recordData.currentDeposit) || 0,
        'savingsData.targetDeposit': parseFloat(recordData.targetDeposit) || 0,
        'savingsData.expectedAnnualRate': recordData.expectedAnnualRate || '0',
        'savingsData.depositDuration': parseFloat(recordData.depositDuration) || 0,
        'savingsData.durationType': recordData.durationType || 'month'
      });
      this.saveSavingsData();
      this.calculateSavings();
      
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

  saveSavingsData: function() {
    try {
      const dataToSave = {
        currentDeposit: this.data.savingsData.currentDeposit,
        targetDeposit: this.data.savingsData.targetDeposit,
        expectedAnnualRate: this.data.savingsData.expectedAnnualRate,
        depositDuration: this.data.savingsData.depositDuration,
        durationType: this.data.savingsData.durationType
      };
      wx.setStorageSync('savings_page_data', dataToSave);
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  },

  loadSavingsData: function() {
    try {
      const savedData = wx.getStorageSync('savings_page_data');
      if (savedData) {
        this.setData({
          'savingsData.currentDeposit': savedData.currentDeposit !== undefined ? savedData.currentDeposit : this.data.savingsData.currentDeposit,
          'savingsData.targetDeposit': savedData.targetDeposit !== undefined ? savedData.targetDeposit : this.data.savingsData.targetDeposit,
          'savingsData.expectedAnnualRate': savedData.expectedAnnualRate !== undefined ? savedData.expectedAnnualRate : this.data.savingsData.expectedAnnualRate,
          'savingsData.depositDuration': savedData.depositDuration !== undefined ? savedData.depositDuration : this.data.savingsData.depositDuration,
          'savingsData.durationType': savedData.durationType || this.data.savingsData.durationType
        });
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  },

  // ========== 计算年化页面方法 ==========
  
  onAnnualPrincipalInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const bounds = this.data.BOUNDS.principal;
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'annualData.principal': numValue
    });
    this.saveAnnualData();
    this.calculateAnnual();
  },

  onAnnualFinalAmountInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const bounds = this.data.BOUNDS.finalAmount;
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'annualData.finalAmount': numValue
    });
    this.saveAnnualData();
    this.calculateAnnual();
  },

  onAnnualDurationInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    const durationType = this.data.annualData.durationType;
    const bounds = this.data.BOUNDS.duration[durationType];
    
    if (numValue < bounds.min) numValue = bounds.min;
    else if (numValue > bounds.max) numValue = bounds.max;
    
    this.setData({
      'annualData.duration': numValue
    });
    this.saveAnnualData();
    this.calculateAnnual();
  },

  onAnnualDurationTypeChange: function(e) {
    const type = e.currentTarget.dataset.type;
    const currentDuration = this.data.annualData.duration;
    const bounds = this.data.BOUNDS.duration[type];
    
    let adjustedDuration = currentDuration;
    if (currentDuration < bounds.min) adjustedDuration = bounds.min;
    else if (currentDuration > bounds.max) adjustedDuration = bounds.max;
    
    this.setData({
      'annualData.durationType': type,
      'annualData.duration': adjustedDuration
    });
    this.saveAnnualData();
    this.calculateAnnual();
  },

  calculateAnnual: function() {
    const annualData = this.data.annualData;

    if (annualData.principal <= 0 || annualData.finalAmount <= 0 || annualData.duration <= 0) {
      this.setData({
        'annualData.annualizedRate': 0,
        'annualData.totalReturn': 0,
        'annualData.totalReturnRate': 0
      });
      return;
    }

    const totalReturn = annualData.finalAmount - annualData.principal;
    const totalReturnRate = totalReturn / annualData.principal;

    let years = 0;
    if (annualData.durationType === 'year') {
      years = annualData.duration;
    } else if (annualData.durationType === 'month') {
      years = annualData.duration / 12;
    } else if (annualData.durationType === 'day') {
      years = annualData.duration / 365;
    }

    let annualizedRate = 0;
    if (years > 0) {
      annualizedRate = Math.pow(annualData.finalAmount / annualData.principal, 1 / years) - 1;
    }

    const chartData = calcUtils.generateAnnualTimeSeriesData({
      principal: annualData.principal,
      finalAmount: annualData.finalAmount,
      duration: annualData.duration,
      durationType: annualData.durationType
    });

    this.setData({
      'annualData.totalReturn': this.formatNumber(totalReturn),
      'annualData.totalReturnRate': this.formatNumber(totalReturnRate * 100),
      'annualData.annualizedRate': this.formatNumber(annualizedRate * 100),
      'annualData.chartData': chartData
    });
  },

  onAnnualSaveRecord: function() {
    const annualData = this.data.annualData;
    if (parseFloat(annualData.annualizedRate) <= 0 && parseFloat(annualData.totalReturn) <= 0) {
      wx.showToast({
        title: '暂无计算结果',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '收藏记录',
      editable: true,
      placeholderText: '请输入记录名称（可选）',
      success: (res) => {
        if (res.confirm) {
          this.saveAnnualRecordWithName(res.content || '');
        }
      }
    });
  },

  saveAnnualRecordWithName: function(name) {
    const annualData = this.data.annualData;
    try {
      const historyRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: name || `计算年化_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
        type: 'annual',
        input: {
          principal: annualData.principal,
          finalAmount: annualData.finalAmount,
          duration: annualData.duration,
          durationType: annualData.durationType
        },
        result: {
          totalReturn: annualData.totalReturn,
          totalReturnRate: annualData.totalReturnRate,
          annualizedRate: annualData.annualizedRate
        }
      };

      let historyList = wx.getStorageSync('annual_history_list') || [];
      historyList.unshift(historyRecord);
      if (historyList.length > 100) {
        historyList = historyList.slice(0, 100);
      }
      wx.setStorageSync('annual_history_list', historyList);
      
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

  loadAnnualFromRecord: function(recordData) {
    try {
      this.setData({
        'annualData.principal': parseFloat(recordData.principal) || 0,
        'annualData.finalAmount': parseFloat(recordData.finalAmount) || 0,
        'annualData.duration': parseFloat(recordData.duration) || 0,
        'annualData.durationType': recordData.durationType || 'year'
      });
      this.saveAnnualData();
      this.calculateAnnual();
      
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

  saveAnnualData: function() {
    try {
      const dataToSave = {
        principal: this.data.annualData.principal,
        finalAmount: this.data.annualData.finalAmount,
        duration: this.data.annualData.duration,
        durationType: this.data.annualData.durationType
      };
      wx.setStorageSync('annual_page_data', dataToSave);
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  },

  loadAnnualData: function() {
    try {
      const savedData = wx.getStorageSync('annual_page_data');
      if (savedData) {
        this.setData({
          'annualData.principal': savedData.principal !== undefined ? savedData.principal : this.data.annualData.principal,
          'annualData.finalAmount': savedData.finalAmount !== undefined ? savedData.finalAmount : this.data.annualData.finalAmount,
          'annualData.duration': savedData.duration !== undefined ? savedData.duration : this.data.annualData.duration,
          'annualData.durationType': savedData.durationType || this.data.annualData.durationType
        });
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  },

  // ========== 通用方法 ==========
  
  formatNumber: function(num) {
    const formatted = num.toFixed(2);
    return parseFloat(formatted).toString();
  },

  loadAllSavedData: function() {
    this.loadCalcData();
    this.loadSavingsData();
    this.loadAnnualData();
  },

  calculateAll: function() {
    this.calculateCalc();
    this.calculateSavings();
    this.calculateAnnual();
  },

  loadFromShareData: function(shareData) {
    // 根据分享数据类型判断应该载入哪个segment
    if (shareData.principal !== undefined && shareData.fixedInvestment !== undefined) {
      // 计算收益
      this.setData({ currentSegment: 0 });
      this.setData({
        'calcData.principal': parseFloat(shareData.principal) || 0,
        'calcData.fixedInvestment': parseFloat(shareData.fixedInvestment) || 0,
        'calcData.fixedInvestmentType': shareData.fixedInvestmentType || 'monthly',
        'calcData.annualRate': shareData.annualRate || '0',
        'calcData.duration': parseFloat(shareData.duration) || 0,
        'calcData.durationType': shareData.durationType || 'month',
        'calcData.compoundPeriod': shareData.compoundPeriod || 'month'
      });
      this.saveCalcData();
      this.calculateCalc();
    } else if (shareData.currentDeposit !== undefined && shareData.targetDeposit !== undefined) {
      // 存钱计划
      this.setData({ currentSegment: 1 });
      this.setData({
        'savingsData.currentDeposit': parseFloat(shareData.currentDeposit) || 0,
        'savingsData.targetDeposit': parseFloat(shareData.targetDeposit) || 0,
        'savingsData.expectedAnnualRate': shareData.expectedAnnualRate || '0',
        'savingsData.depositDuration': parseFloat(shareData.depositDuration) || 0,
        'savingsData.durationType': shareData.durationType || 'month'
      });
      this.saveSavingsData();
      this.calculateSavings();
    } else if (shareData.principal !== undefined && shareData.finalAmount !== undefined) {
      // 计算年化
      this.setData({ currentSegment: 2 });
      this.setData({
        'annualData.principal': parseFloat(shareData.principal) || 0,
        'annualData.finalAmount': parseFloat(shareData.finalAmount) || 0,
        'annualData.duration': parseFloat(shareData.duration) || 0,
        'annualData.durationType': shareData.durationType || 'year'
      });
      this.saveAnnualData();
      this.calculateAnnual();
    }
    
    wx.showToast({
      title: '已载入分享数据',
      icon: 'success',
      duration: 2000
    });
  },

  // 分享功能
  onShareAppMessage: function(e) {
    const type = e.target.dataset.type || 'calc';
    const currentSegment = type === 'calc' ? 0 : type === 'savings' ? 1 : 2;
    
    if (currentSegment === 0) {
      const calcData = this.data.calcData;
      if (parseFloat(calcData.totalInvestment) <= 0 && parseFloat(calcData.finalAssets) <= 0) {
        return {
          title: '复利计算收益结果',
          path: '/pages/home/index'
        };
      }
      const shareData = {
        principal: calcData.principal,
        fixedInvestment: calcData.fixedInvestment,
        fixedInvestmentType: calcData.fixedInvestmentType,
        annualRate: calcData.annualRate,
        duration: calcData.duration,
        durationType: calcData.durationType,
        compoundPeriod: calcData.compoundPeriod
      };
      const fixedInvestmentText = calcData.fixedInvestmentType === 'yearly' ? '每年' : '每月';
      const durationUnit = calcData.durationType === 'year' ? '年' : calcData.durationType === 'month' ? '月' : '天';
      let shareTitle = `复利计算：本金${calcData.principal}元，${fixedInvestmentText}定投${calcData.fixedInvestment}元，年化${calcData.annualRate}%，历时${calcData.duration}${durationUnit}`;
      if (shareTitle.length > 30) {
        shareTitle = `复利计算：最终资产${calcData.finalAssets}元，收益${calcData.finalReturn}元`;
      }
      return {
        title: shareTitle,
        path: `/pages/home/index?share=true&data=${encodeURIComponent(JSON.stringify(shareData))}`,
        imageUrl: ''
      };
    } else if (currentSegment === 1) {
      const savingsData = this.data.savingsData;
      if (parseFloat(savingsData.monthlyDeposit) <= 0 && parseFloat(savingsData.totalInvestment) <= 0) {
        return {
          title: '存钱计划计算结果',
          path: '/pages/home/index'
        };
      }
      const shareData = {
        currentDeposit: savingsData.currentDeposit,
        targetDeposit: savingsData.targetDeposit,
        expectedAnnualRate: savingsData.expectedAnnualRate,
        depositDuration: savingsData.depositDuration,
        durationType: savingsData.durationType
      };
      const durationUnit = savingsData.durationType === 'year' ? '年' : savingsData.durationType === 'month' ? '月' : '天';
      let shareTitle = `存钱计划：当前${savingsData.currentDeposit}元，目标${savingsData.targetDeposit}元，每月存${savingsData.monthlyDeposit}元，年化${savingsData.expectedAnnualRate}%，历时${savingsData.depositDuration}${durationUnit}`;
      if (shareTitle.length > 30) {
        shareTitle = `存钱计划：每月存${savingsData.monthlyDeposit}元，最终资产${savingsData.finalAssets}元`;
      }
      return {
        title: shareTitle,
        path: `/pages/home/index?share=true&data=${encodeURIComponent(JSON.stringify(shareData))}`,
        imageUrl: ''
      };
    } else {
      const annualData = this.data.annualData;
      if (parseFloat(annualData.annualizedRate) <= 0 && parseFloat(annualData.totalReturn) <= 0) {
        return {
          title: '年化收益率计算结果',
          path: '/pages/home/index'
        };
      }
      const shareData = {
        principal: annualData.principal,
        finalAmount: annualData.finalAmount,
        duration: annualData.duration,
        durationType: annualData.durationType
      };
      const durationUnit = annualData.durationType === 'year' ? '年' : annualData.durationType === 'month' ? '月' : '天';
      let shareTitle = `年化收益率：${annualData.annualizedRate}%，本金${annualData.principal}元，最终${annualData.finalAmount}元，历时${annualData.duration}${durationUnit}`;
      if (shareTitle.length > 30) {
        shareTitle = `年化收益率：${annualData.annualizedRate}%，总收益${annualData.totalReturn}元`;
      }
      return {
        title: shareTitle,
        path: `/pages/home/index?share=true&data=${encodeURIComponent(JSON.stringify(shareData))}`,
        imageUrl: ''
      };
    }
  },

  onShareTimeline: function(e) {
    // 朋友圈分享逻辑类似，这里简化处理
    return this.onShareAppMessage(e);
  },

  // ========== 去广告相关方法 ==========
  
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

  updateRemainingTime: function() {
    const app = getApp();
    const remaining = app.getRemainingTime();
    
    if (remaining <= 0) {
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

  startAdFreeCountdown: function() {
    if (this.adFreeTimer) {
      clearInterval(this.adFreeTimer);
    }
    
    this.updateRemainingTime();
    
    this.adFreeTimer = setInterval(() => {
      this.updateRemainingTime();
    }, 1000);
  },

  onWatchAd: function() {
    const app = getApp();
    
    if (app.globalData.isAdFree) {
      wx.showToast({
        title: '您已享受去广告服务',
        icon: 'none',
        duration: 2000
      });
      return;
    }

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

  watchRewardVideoAd: function() {
    wx.showLoading({
      title: '加载广告中...',
      mask: true
    });
    
    setTimeout(() => {
      wx.hideLoading();
      this.onAdReward();
    }, 2000);
  },

  onAdReward: function() {
    const app = getApp();
    app.setAdFree();
    
    this.setData({
      isAdFreeActive: true
    });
    
    this.startAdFreeCountdown();
    
    wx.showToast({
      title: '已获得24小时去广告体验',
      icon: 'success',
      duration: 2000
    });
  }
});

