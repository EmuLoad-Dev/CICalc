// pages/settings/index.js
Page({
  data: {
    // 产品信息
    productName: '',
    appVersion: ''
  },

  onLoad: function (options) {
    // 加载产品信息
    this.loadProductInfo();
  },

  onShow: function () {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
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

