/**
 * 推送通知模块 - v4.0
 * 支持浏览器Notification、站内消息中心、离线队列
 */
const AppNotification = {
  // 通知权限状态
  permission: 'default', // 'default' | 'granted' | 'denied'
  
  // 消息队列（内存缓存）
  messages: [],
  
  // 监听器
  listeners: [],
  
  // 初始化
  async init() {
    // 检查浏览器通知支持
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    
    // 加载历史消息
    await this.loadMessages();
    
    // 注册Service Worker用于推送
    this.registerSW();
    
    console.log('AppNotification: 推送通知模块初始化完成');
    return this;
  },
  
  // 请求通知权限
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('AppNotification: 浏览器不支持通知');
      return false;
    }
    
    if (this.permission === 'granted') {
      return true;
    }
    
    if (this.permission !== 'denied') {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    }
    
    return false;
  },
  
  // 注册Service Worker用于后台推送
  async registerSW() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('AppNotification: Service Worker注册成功');
        return registration;
      } catch (error) {
        console.error('AppNotification: Service Worker注册失败', error);
      }
    }
    return null;
  },
  
  // 发送通知
  async send(options = {}) {
    const {
      type = 'info',
      title,
      message,
      projectId = null,
      fromUser = null,
      toUser = null,
      data = {}
    } = options;
    
    // 创建消息对象
    const notification = {
      id: this.generateId(),
      type,
      title,
      message,
      projectId,
      fromUser,
      fromUserName: Store?.getCurrentUser?.()?.name || '系统',
      toUser,
      read: false,
      createTime: new Date().toISOString(),
      data
    };
    
    // 保存到IndexedDB
    await this.saveToDB(notification);
    
    // 如果有网络，推送浏览器通知
    if (navigator.onLine && this.permission === 'granted') {
      this.showBrowserNotification(notification);
    }
    
    // 通知监听器
    this.notifyListeners(notification);
    
    // 如果离线，添加到离线队列
    if (!navigator.onLine) {
      await this.addToOfflineQueue(notification);
    }
    
    console.log('AppNotification: 通知已发送', title);
    return notification;
  },
  
  // 显示浏览器通知
  showBrowserNotification(notification) {
    if (this.permission !== 'granted') return;
    
    try {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: './icon-192.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });
      
      // 点击事件
      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
        
        // 跳转到相关页面
        if (notification.projectId) {
          // 通过自定义事件通知App处理
          window.dispatchEvent(new CustomEvent('notificationClick', {
            detail: notification
          }));
        }
      };
      
      // 自动关闭
      setTimeout(() => browserNotif.close(), 5000);
      
    } catch (error) {
      console.error('AppNotification: 浏览器通知失败', error);
    }
  },
  
  // 保存到IndexedDB
  async saveToDB(notification) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        const addRequest = store.add(notification);
        
        addRequest.onsuccess = () => {
          this.messages.unshift(notification);
          resolve(notification);
        };
        
        addRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 更新消息状态
  async markAsRead(notificationId) {
    const notification = this.messages.find(m => m.id === notificationId);
    if (!notification) return;
    
    notification.read = true;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        const putRequest = store.put(notification);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 标记全部已读
  async markAllAsRead() {
    const unread = this.messages.filter(m => !m.read);
    
    for (const notification of unread) {
      notification.read = true;
      
      await new Promise((resolve) => {
        const request = indexedDB.open('juda_photos_db', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['notifications'], 'readwrite');
          const store = transaction.objectStore('notifications');
          store.put(notification);
          transaction.oncomplete = resolve;
        };
      });
    }
    
    this.notifyListeners({ type: 'allRead' });
  },
  
  // 加载消息
  async loadMessages() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['notifications'], 'readonly');
        const store = transaction.objectStore('notifications');
        const request = store.getAll();
        
        request.onsuccess = () => {
          this.messages = (request.result || [])
            .sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
          resolve(this.messages);
        };
        
        request.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 获取消息列表
  getMessages(limit = 50) {
    return this.messages.slice(0, limit);
  },
  
  // 获取未读消息
  getUnreadMessages() {
    return this.messages.filter(m => !m.read);
  },
  
  // 获取未读数量
  getUnreadCount() {
    return this.messages.filter(m => !m.read).length;
  },
  
  // 添加到离线队列
  async addToOfflineQueue(notification) {
    // 离线队列存储在localStorage
    const queue = JSON.parse(localStorage.getItem('juda_offline_notifications') || '[]');
    queue.push(notification);
    localStorage.setItem('juda_offline_notifications', JSON.stringify(queue));
  },
  
  // 同步离线通知
  async syncOfflineNotifications() {
    if (!navigator.onLine) return;
    
    const queue = JSON.parse(localStorage.getItem('juda_offline_notifications') || '[]');
    if (queue.length === 0) return;
    
    console.log(`AppNotification: 同步 ${queue.length} 条离线通知`);
    
    // 实际发送这些通知
    for (const notification of queue) {
      if (this.permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    }
    
    // 清空队列
    localStorage.removeItem('juda_offline_notifications');
  },
  
  // 添加监听器
  addListener(callback) {
    this.listeners.push(callback);
  },
  
  // 移除监听器
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  },
  
  // 通知监听器
  notifyListeners(notification) {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (e) {
        console.error('AppNotification: 监听器执行错误', e);
      }
    });
  },
  
  // 删除消息
  async deleteMessage(notificationId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        const deleteRequest = store.delete(notificationId);
        
        deleteRequest.onsuccess = () => {
          this.messages = this.messages.filter(m => m.id !== notificationId);
          resolve();
        };
        
        deleteRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // ========== 常用通知快捷方法 ==========
  
  // 验收通知（验收员）
  async notifyReviewRequest(project, stepName) {
    return this.send({
      type: 'review_request',
      title: '📋 验收请求',
      message: `${project.customerName} 的「${stepName}」待验收`,
      projectId: project.id,
      fromUser: Store?.getCurrentUser?.()?.id,
      toUser: project.reviewerId
    });
  },
  
  // 验收结果通知（施工员）
  async notifyReviewResult(project, stepName, approved, reviewNote) {
    const action = approved ? '✅ 验收通过' : '❌ 验收打回';
    return this.send({
      type: approved ? 'review_approved' : 'review_rejected',
      title: action,
      message: approved 
        ? `您的「${stepName}」已通过验收`
        : `您的「${stepName}」被打回：${reviewNote}`,
      projectId: project.id,
      fromUser: Store?.getCurrentUser?.()?.id,
      toUser: project.workerId
    });
  },
  
  // 异常上报通知（管理员）
  async notifyAnomalyReport(report) {
    return this.send({
      type: 'anomaly',
      title: '⚠️ 异常上报',
      message: `${report.reportedByName}上报了${report.typeName}：${report.description?.slice(0, 50) || ''}`,
      projectId: report.projectId,
      fromUser: report.reportedBy
    });
  },
  
  // 项目完工通知
  async notifyProjectComplete(project) {
    return this.send({
      type: 'project_complete',
      title: '🎉 项目完工',
      message: `${project.customerName} 的防水工程已完工，请验收`,
      projectId: project.id,
      fromUser: Store?.getCurrentUser?.()?.id
    });
  },
  
  // 工具方法
  generateId() {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  // 格式化时间显示
  formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

// 导出
window.AppNotification = AppNotification;
