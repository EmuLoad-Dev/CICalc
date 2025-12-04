// app.js
App({
  globalData: {
    pendingLoadRecord: null, // 待载入的记录数据
    pendingLoadRecordType: null // 待载入的记录类型
  },
  onLaunch: function () {
    console.log('Hello World 小程序启动')
  },
});
