// app.js
App({
  globalData: {
    pendingLoadRecord: null, // 待载入的记录数据
    pendingLoadRecordType: null, // 待载入的记录类型
    // 去广告激励状态
    adFreeUntil: null, // 去广告有效期截止时间戳（毫秒），null表示未观看广告
    isAdFree: false // 当前是否处于去广告状态（占位符，用于后续去除广告逻辑）
  },
  onLaunch: function () {
    console.log('Hello World 小程序启动')
    // 启动时检查去广告状态
    this.checkAdFreeStatus();
  },
  // 检查去广告状态是否有效
  checkAdFreeStatus: function() {
    try {
      const savedTime = wx.getStorageSync('adFreeUntil');
      if (savedTime) {
        const now = Date.now();
        if (now < savedTime) {
          // 仍在有效期内
          this.globalData.adFreeUntil = savedTime;
          this.globalData.isAdFree = true;
        } else {
          // 已过期，清除状态
          this.globalData.adFreeUntil = null;
          this.globalData.isAdFree = false;
          wx.removeStorageSync('adFreeUntil');
        }
      } else {
        this.globalData.adFreeUntil = null;
        this.globalData.isAdFree = false;
      }
    } catch (e) {
      console.error('检查去广告状态失败:', e);
      this.globalData.adFreeUntil = null;
      this.globalData.isAdFree = false;
    }
  },
  // 设置去广告状态（观看广告后调用）
  setAdFree: function() {
    const now = Date.now();
    const expireTime = now + 24 * 60 * 60 * 1000; // 24小时后过期
    this.globalData.adFreeUntil = expireTime;
    this.globalData.isAdFree = true;
    try {
      wx.setStorageSync('adFreeUntil', expireTime);
    } catch (e) {
      console.error('保存去广告状态失败:', e);
    }
  },
  // 获取剩余时间（秒）
  getRemainingTime: function() {
    if (!this.globalData.adFreeUntil) {
      return 0;
    }
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((this.globalData.adFreeUntil - now) / 1000));
    return remaining;
  }
});
