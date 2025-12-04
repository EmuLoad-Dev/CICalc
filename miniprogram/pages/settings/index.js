// pages/settings/index.js
Page({
  data: {
    // 去广告状态
    isAdFreeActive: false,
    remainingTimeText: '',
    // 产品信息
    productName: '',
    appVersion: ''
  },

  onLoad: function (options) {
    // 检查去广告状态
    this.checkAdFreeStatus();
    // 加载产品信息
    this.loadProductInfo();
  },

  onShow: function () {
    // 检查去广告状态
    this.checkAdFreeStatus();
    this.startAdFreeCountdown();
    
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
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
  },

  // ========== 产品信息相关方法 ==========
  
  loadProductInfo: function() {
    const app = getApp();
    const productName = app.getProductName();
    const appVersion = app.getAppVersion();
    
    this.setData({
      productName: productName,
      appVersion: appVersion
    });
  },

  // ========== 数据管理相关方法 ==========
  
  // 清空所有收藏记录
  onClearAllHistory: function() {
    wx.showModal({
      title: '清空收藏记录',
      content: '确定要清空所有收藏记录吗？此操作不可恢复。',
      confirmText: '确定',
      cancelText: '取消',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          this.clearAllHistory();
        }
      }
    });
  },

  // 执行清空收藏记录
  clearAllHistory: function() {
    try {
      wx.removeStorageSync('calc_history_list');
      wx.removeStorageSync('savings_history_list');
      wx.removeStorageSync('annual_history_list');
      
      wx.showToast({
        title: '已清空',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.error('清空记录失败:', e);
      wx.showToast({
        title: '清空失败',
        icon: 'none',
        duration: 2000
      });
    }
  }
});

