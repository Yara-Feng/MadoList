// components/task-card/index.js
const { PRIORITY, VISIBILITY, STATUS } = require('../../utils/constants');

Component({
  properties: {
    task: {
      type: Object,
      value: {},
    },
  },

  computed: {
    priorityLabel() {
      const map = { HIGH: '高', MEDIUM: '中', LOW: '低' };
      return map[this.data.task.priority] || '中';
    },
    priorityClass() {
      const map = { HIGH: 'tag-priority-high', MEDIUM: 'tag-priority-medium', LOW: 'tag-priority-low' };
      return map[this.data.task.priority] || '';
    },
    visibilityLabel() {
      return this.data.task.visibility === 'GROUP' ? '共享' : '个人';
    },
    visibilityClass() {
      return this.data.task.visibility === 'GROUP' ? 'tag-visibility-group' : 'tag-visibility-personal';
    },
    isDone() {
      return this.data.task.status === 'DONE';
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { task: this.data.task });
    },

    onToggle() {
      this.triggerEvent('toggle', { taskId: this.data.task._id });
    },

    onLongPress() {
      this.triggerEvent('longpress', { task: this.data.task });
    },
  },
});
