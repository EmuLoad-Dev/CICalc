// pages/annual/index.js

Page({
  data: {
    // 输入字段
    principal: 100000, // 本金（默认10万元）
    finalAmount: 120000, // 最终金额（默认12万元，3年收益2万）
    duration: 3, // 投资时长（默认3年）
    durationType: 'year', // 时长类型：year/month/day
    
    // 计算结果
    annualizedRate: 0, // 年化收益率
    totalReturn: 0, // 总收益
    totalReturnRate: 0, // 总收益率
    
    // 边界值常量
    BOUNDS: {
      principal: { min: 0, max: 10000000000 }, // 本金：0 - 100亿
      finalAmount: { min: 0, max: 10000000000 }, // 最终金额：0 - 100亿
      duration: {
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
    if (app.globalData.pendingLoadRecord && app.globalData.pendingLoadRecordType === 'annual') {
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
          selected: 2
        });
      }
    }
  },

  // 从收藏记录载入数据
  loadFromRecord: function(recordData) {
    try {
      this.setData({
        principal: parseFloat(recordData.principal) || 0,
        finalAmount: parseFloat(recordData.finalAmount) || 0,
        duration: parseFloat(recordData.duration) || 0,
        durationType: recordData.durationType || 'year'
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
        finalAmount: this.data.finalAmount,
        duration: this.data.duration,
        durationType: this.data.durationType
      };
      wx.setStorageSync('annual_page_data', dataToSave);
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  },

  // 从本地存储加载数据
  loadSavedData: function() {
    try {
      const savedData = wx.getStorageSync('annual_page_data');
      if (savedData) {
        this.setData({
          principal: savedData.principal !== undefined ? savedData.principal : this.data.principal,
          finalAmount: savedData.finalAmount !== undefined ? savedData.finalAmount : this.data.finalAmount,
          duration: savedData.duration !== undefined ? savedData.duration : this.data.duration,
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
      wx.removeStorageSync('annual_page_data');
      // 恢复默认值
      this.setData({
        principal: 100000,
        finalAmount: 120000,
        duration: 3,
        durationType: 'year'
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

  // 输入最终金额
  onFinalAmountInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    // 边界值验证
    const bounds = this.data.BOUNDS.finalAmount;
    if (numValue < bounds.min) {
      numValue = bounds.min;
      wx.showToast({
        title: `最终金额不能小于${bounds.min}元`,
        icon: 'none',
        duration: 2000
      });
    } else if (numValue > bounds.max) {
      numValue = bounds.max;
      wx.showToast({
        title: `最终金额不能超过${bounds.max}元`,
        icon: 'none',
        duration: 2000
      });
    }
    this.setData({
      finalAmount: numValue
    });
    this.saveData();
    this.calculate();
  },

  // 输入投资时长
  onDurationInput: function(e) {
    const value = e.detail.value;
    let numValue = parseFloat(value) || 0;
    // 根据投资时长类型获取对应的边界值
    const durationType = this.data.durationType;
    const bounds = this.data.BOUNDS.duration[durationType];
    
    if (numValue < bounds.min) {
      numValue = bounds.min;
      const unit = durationType === 'year' ? '年' : durationType === 'month' ? '月' : '天';
      wx.showToast({
        title: `投资时长不能小于${bounds.min}${unit}`,
        icon: 'none',
        duration: 2000
      });
    } else if (numValue > bounds.max) {
      numValue = bounds.max;
      const unit = durationType === 'year' ? '年' : durationType === 'month' ? '月' : '天';
      wx.showToast({
        title: `投资时长不能超过${bounds.max}${unit}`,
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

  // 切换时长类型
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
        title: `投资时长已调整为最大值${bounds.max}${unit}`,
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

  // 格式化数字：如果小数部分为0，则不显示小数点
  formatNumber: function(num) {
    // 先格式化为2位小数
    const formatted = num.toFixed(2);
    // 去掉末尾的0和小数点
    return parseFloat(formatted).toString();
  },

  // 计算年化收益率
  calculate: function() {
    const {
      principal,
      finalAmount,
      duration,
      durationType
    } = this.data;

    if (principal <= 0 || finalAmount <= 0 || duration <= 0) {
      this.setData({
        annualizedRate: 0,
        totalReturn: 0,
        totalReturnRate: 0
      });
      return;
    }

    // 计算总收益和总收益率
    const totalReturn = finalAmount - principal;
    const totalReturnRate = totalReturn / principal;

    // 将时长转换为年
    let years = 0;
    if (durationType === 'year') {
      years = duration;
    } else if (durationType === 'month') {
      years = duration / 12;
    } else if (durationType === 'day') {
      years = duration / 365;
    }

    // 计算年化收益率：(最终金额/本金)^(1/年数) - 1
    let annualizedRate = 0;
    if (years > 0) {
      annualizedRate = Math.pow(finalAmount / principal, 1 / years) - 1;
    }

    this.setData({
      totalReturn: this.formatNumber(totalReturn),
      totalReturnRate: this.formatNumber(totalReturnRate * 100),
      annualizedRate: this.formatNumber(annualizedRate * 100)
    });
  },

  // 手动收藏记录
  onSaveRecord: function() {
    const {
      principal,
      finalAmount,
      duration,
      durationType,
      totalReturn,
      totalReturnRate,
      annualizedRate
    } = this.data;

    // 检查是否有有效结果
    if (parseFloat(annualizedRate) <= 0 && parseFloat(totalReturn) <= 0) {
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
      finalAmount,
      duration,
      durationType,
      totalReturn,
      totalReturnRate,
      annualizedRate
    } = this.data;

    try {
      const historyRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: name || `计算年化_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
        type: 'annual', // 记录类型：计算年化
        // 输入参数
        input: {
          principal: principal,
          finalAmount: finalAmount,
          duration: duration,
          durationType: durationType
        },
        // 计算结果
        result: {
          totalReturn: totalReturn,
          totalReturnRate: totalReturnRate,
          annualizedRate: annualizedRate
        }
      };

      // 获取现有历史记录
      let historyList = wx.getStorageSync('annual_history_list') || [];
      
      // 添加到列表开头（最新的在前面）
      historyList.unshift(historyRecord);
      
      // 限制历史记录数量，最多保存100条
      if (historyList.length > 100) {
        historyList = historyList.slice(0, 100);
      }
      
      // 保存到本地存储
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
