// app.js
App({
  globalData: {
    pendingLoadRecord: null, // 待载入的记录数据
    pendingLoadRecordType: null, // 待载入的记录类型
    pendingLoadTemplate: null, // 待载入的模板数据
    pendingLoadTemplateType: null, // 待载入的模板类型
    // 去广告激励状态
    adFreeUntil: null, // 去广告有效期截止时间戳（毫秒），null表示未观看广告
    isAdFree: false, // 当前是否处于去广告状态（占位符，用于后续去除广告逻辑）
    // 产品信息
    productName: '复利计算器', // 产品名称
    appVersion: '1.8.1' // 应用版本号
  },
  onLaunch: function () {
    console.log('Hello World 小程序启动')
    // 启动时检查去广告状态
    this.checkAdFreeStatus();
    // 初始化产品信息
    this.initProductInfo();
  },
  // 初始化产品信息
  initProductInfo: function() {
    try {
      // 产品名称：使用导航栏标题（与 app.json 中的 navigationBarTitleText 保持一致）
      this.globalData.productName = '极简复利计算器';
      
      // 应用版本号：微信小程序无法通过API获取自己的应用版本号
      // wx.getAccountInfoSync() 返回的 version 在开发/体验版中可能为空，且不是应用版本号
      // 因此应用版本号需要在代码中手动定义，或从配置文件中读取
      // 当前使用 globalData 中定义的默认版本号 '1.0.0'
      // 如果需要更新版本号，直接修改 globalData.appVersion 的值即可
      
      // 可选：尝试获取小程序环境信息（用于调试）
      try {
        const accountInfo = wx.getAccountInfoSync();
        if (accountInfo && accountInfo.miniProgram) {
          // 可以获取环境版本（develop/trial/release），但这不是应用版本号
          const envVersion = accountInfo.miniProgram.envVersion;
          console.log('小程序环境版本:', envVersion);
          // 注意：accountInfo.miniProgram.version 在开发/体验版中可能为空
          // 且即使有值，也不是我们定义的应用版本号
        }
      } catch (e) {
        console.log('获取小程序账号信息失败:', e);
      }
    } catch (e) {
      console.error('初始化产品信息失败:', e);
    }
  },
  // 获取产品名称
  getProductName: function() {
    return this.globalData.productName;
  },
  // 获取应用版本号
  getAppVersion: function() {
    return this.globalData.appVersion;
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
