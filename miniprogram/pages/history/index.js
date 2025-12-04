// pages/history/index.js

Page({
  data: {
    historyList: [], // 历史记录列表
    isEmpty: true // 是否为空
  },

  onLoad: function () {
    this.loadHistoryList();
  },

  onShow: function () {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
    // 每次显示页面时重新加载历史记录（可能在其他页面有新的记录）
    this.loadHistoryList();
  },

  // 加载历史记录列表
  loadHistoryList: function() {
    try {
      // 合并所有类型的历史记录
      const calcList = (wx.getStorageSync('calc_history_list') || []).map(item => ({
        ...item,
        type: item.type || 'calc'
      }));
      const savingsList = (wx.getStorageSync('savings_history_list') || []).map(item => ({
        ...item,
        type: item.type || 'savings'
      }));
      const annualList = (wx.getStorageSync('annual_history_list') || []).map(item => ({
        ...item,
        type: item.type || 'annual'
      }));
      
      // 合并并按时间戳排序（最新的在前）
      let allHistoryList = [...calcList, ...savingsList, ...annualList];
      allHistoryList.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.id).getTime();
        const timeB = new Date(b.timestamp || b.id).getTime();
        return timeB - timeA;
      });
      
      // 格式化时间和类型名称
      const formattedList = allHistoryList.map(item => {
        const typeNames = {
          'calc': '计算收益',
          'savings': '存钱计划',
          'annual': '计算年化'
        };
        return {
          ...item,
          formattedTime: this.formatTime(item.timestamp || item.id),
          typeName: typeNames[item.type] || '未知类型'
        };
      });
      
      this.setData({
        historyList: formattedList,
        isEmpty: formattedList.length === 0
      });
    } catch (e) {
      console.error('加载历史记录失败:', e);
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 格式化时间
  formatTime: function(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 点击记录项
  onItemClick: function(e) {
    // 如果点击的是操作按钮区域，不处理
    if (e.target.dataset && (e.target.dataset.index !== undefined || e.target.dataset.action)) {
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    if (index === undefined) {
      return;
    }
    
    const record = this.data.historyList[index];
    
    if (!record) {
      return;
    }

    // 检查目标页面是否有保存的数据
    let hasData = false;
    let storageKey = '';
    
    if (record.type === 'calc') {
      storageKey = 'calc_page_data';
    } else if (record.type === 'savings') {
      storageKey = 'savings_page_data';
    } else if (record.type === 'annual') {
      storageKey = 'annual_page_data';
    }

    if (storageKey) {
      try {
        const savedData = wx.getStorageSync(storageKey);
        hasData = savedData && Object.keys(savedData).length > 0;
      } catch (e) {
        console.error('检查数据失败:', e);
      }
    }

    // 根据是否有数据，显示不同的提示内容
    let content = '';
    if (hasData) {
      content = `确定要载入"${record.name || '未命名记录'}"吗？\n\n注意：当前页面已有数据，载入后会覆盖现有数据。`;
    } else {
      content = `确定要载入"${record.name || '未命名记录'}"吗？`;
    }

    // 询问是否载入记录（合并为一个弹窗）
    wx.showModal({
      title: '载入记录',
      content: content,
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.doLoadRecord(record);
        }
      }
    });
  },

  // 阻止事件冒泡（用于操作按钮）
  stopPropagation: function(e) {
    // 阻止事件冒泡，让操作按钮的点击事件正常触发
  },

  // 执行载入记录
  doLoadRecord: function(record) {
    // 使用全局数据存储要载入的记录
    const app = getApp();
    app.globalData.pendingLoadRecord = record.input;
    app.globalData.pendingLoadRecordType = record.type;

    // 跳转到home页面（三个页面已合并）
    wx.switchTab({ url: '/pages/home/index' });
  },

  // 重命名记录
  onRename: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.historyList[index];
    
    if (!record) {
      return;
    }

    wx.showModal({
      title: '重命名',
      editable: true,
      placeholderText: '请输入新名称',
      content: record.name || '',
      success: (res) => {
        if (res.confirm && res.content) {
          this.renameRecord(index, res.content.trim());
        }
      }
    });
  },

  // 执行重命名
  renameRecord: function(index, newName) {
    try {
      const record = this.data.historyList[index];
      if (!record) {
        return;
      }

      // 根据类型更新对应的记录
      const storageKey = {
        'calc': 'calc_history_list',
        'savings': 'savings_history_list',
        'annual': 'annual_history_list'
      }[record.type] || 'calc_history_list';

      let historyList = wx.getStorageSync(storageKey) || [];
      const recordIndex = historyList.findIndex(item => item.id === record.id);
      if (recordIndex !== -1) {
        historyList[recordIndex].name = newName;
        wx.setStorageSync(storageKey, historyList);
      }
      
      // 重新加载列表
      this.loadHistoryList();
      
      wx.showToast({
        title: '重命名成功',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.error('重命名失败:', e);
      wx.showToast({
        title: '重命名失败',
        icon: 'none',
        duration: 2000
      });
    }
  },


  // 删除单条记录
  onDelete: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.historyList[index];
    
      wx.showModal({
        title: '删除记录',
        content: '确定要删除这条收藏记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord(index);
        }
      }
    });
  },

  // 执行删除
  deleteRecord: function(index) {
    try {
      const record = this.data.historyList[index];
      if (!record) {
        wx.showToast({
          title: '记录不存在',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 根据类型删除对应的记录
      const storageKey = {
        'calc': 'calc_history_list',
        'savings': 'savings_history_list',
        'annual': 'annual_history_list'
      }[record.type] || 'calc_history_list';

      let historyList = wx.getStorageSync(storageKey) || [];
      // 找到并删除对应的记录
      const recordIndex = historyList.findIndex(item => item.id === record.id);
      if (recordIndex !== -1) {
        historyList.splice(recordIndex, 1);
        wx.setStorageSync(storageKey, historyList);
      }
      
      // 重新加载列表
      this.loadHistoryList();
      
      wx.showToast({
        title: '已删除',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.error('删除记录失败:', e);
      wx.showToast({
        title: '删除失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 清空所有收藏记录
  onClearAll: function() {
    wx.showModal({
      title: '清空记录',
      content: '确定要清空所有收藏记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          this.clearAllRecords();
        }
      }
    });
  },

  // 执行清空
  clearAllRecords: function() {
    try {
      wx.removeStorageSync('calc_history_list');
      wx.removeStorageSync('savings_history_list');
      wx.removeStorageSync('annual_history_list');
      this.setData({
        historyList: [],
        isEmpty: true
      });
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
  },

  // 分享到微信好友/群
  onShareAppMessage: function() {
    return {
      title: '极简复利计算器 - 专业的理财计算工具',
      path: '/pages/calc/index',
      imageUrl: '' // 可以设置分享图片
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '极简复利计算器 - 专业的理财计算工具\n\n✨ 功能特点：\n• 复利收益计算：支持本金、定投、年化收益率等参数计算\n• 存钱计划：根据目标存款计算每月需存金额\n• 年化收益率：根据本金和最终金额反推年化收益率\n• 图表可视化：直观展示资产增长曲线\n• 收藏记录：保存计算结果，方便随时查看\n\n简单易用，精准计算，助您做好理财规划！',
      query: '',
      imageUrl: '' // 可以设置分享图片
    };
  }
});

