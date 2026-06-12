// components/empty-state/index.js
Component({
  properties: {
    // 图标文本（emoji）
    icon: {
      type: String,
      value: '📭',
    },
    // 提示文字
    text: {
      type: String,
      value: '暂无数据',
    },
    // 是否显示操作按钮
    showAction: {
      type: Boolean,
      value: false,
    },
    // 按钮文字
    actionText: {
      type: String,
      value: '去创建',
    },
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    },
  },
});
