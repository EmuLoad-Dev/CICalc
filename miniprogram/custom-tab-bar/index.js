// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#007AFF",
    backgroundColor: "#FFFFFF",
    borderStyle: "black",
    list: [
      {
        pagePath: "/pages/home/index",
        text: "计算工具",
        iconPath: "/images/calc.png",
        selectedIconPath: "/images/calc-active.png"
      },
      {
        pagePath: "/pages/history/index",
        text: "收藏记录",
        iconPath: "/images/history.png",
        selectedIconPath: "/images/history-active.png"
      },
      {
        pagePath: "/pages/settings/index",
        text: "设置",
        iconPath: "/images/settings.png",
        selectedIconPath: "/images/settings-active.png"
      }
    ]
  },
  attached() {
    // 获取当前页面路径，设置初始选中状态
    const pages = getCurrentPages()
    if (pages.length === 0) {
      return
    }
    const currentPage = pages[pages.length - 1]
    if (!currentPage || !currentPage.route) {
      return
    }
    const url = currentPage.route
    const selectedIndex = this.data.list.findIndex(item => item.pagePath === '/' + url)
    if (selectedIndex !== -1) {
      this.setData({
        selected: selectedIndex
      })
    }
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      const index = data.index
      this.setData({
        selected: index
      })
      wx.switchTab({url})
    }
  }
})

