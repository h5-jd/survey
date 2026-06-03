/**
 * 离线同步模块 - v4.0
 * 支持离线数据暂存、在线自动同步、冲突处理
 */
const OfflineSync = {
  // 数据库配置（与PhotoManager共用juda_photos_db）
  DB_NAME: 'juda_photos_db',
  DB_VERSION: 2, // 版本升级
  STORE_NAME: 'sync_queue',
  
  // 数据库实例
  db: null,
  
  // 同步状态
  status: {
    isOnline: navigator.onLine,
    pendingCount: 0,
    lastSyncTime: null,
    syncing: false
  },
  
  // 监听器
  listeners: [],
  
  // 初始化
  async init() {
    await this.initDatabase();
    this.bindEvents();
    await this.updatePendingCount();
    console.log('OfflineSync: 离线同步模块初始化完成');
    return this;
  },
  
  // 初始化IndexedDB
  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 同步队列表
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: false
          });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
        
        // 语音备注表
        if (!db.objectStoreNames.contains('voice_notes')) {
          db.createObjectStore('voice_notes', {
            keyPath: 'id',
            autoIncrement: false
          }).createIndex('projectId', 'projectId', { unique: false });
        }
        
        // 视频表
        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', {
            keyPath: 'id',
            autoIncrement: false
          });
          videoStore.createIndex('projectId', 'projectId', { unique: false });
          videoStore.createIndex('stepIndex', 'stepIndex', { unique: false });
        }
        
        // 异常上报表
        if (!db.objectStoreNames.contains('anomaly_reports')) {
          const anomalyStore = db.createObjectStore('anomaly_reports', {
            keyPath: 'id',
            autoIncrement: false
          });
          anomalyStore.createIndex('projectId', 'projectId', { unique: false });
          anomalyStore.createIndex('status', 'status', { unique: false });
        }
        
        // 通知表
        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', {
            keyPath: 'id',
            autoIncrement: false
          });
          notifStore.createIndex('type', 'type', { unique: false });
          notifStore.createIndex('toUser', 'toUser', { unique: false });
          notifStore.createIndex('read', 'read', { unique: false });
        }
        
        // FAQ缓存表
        if (!db.objectStoreNames.contains('faq_cache')) {
          db.createObjectStore('faq_cache', {
            keyPath: 'id',
            autoIncrement: false
          }).createIndex('category', 'category', { unique: false });
        }
        
        console.log('OfflineSync: 数据库表初始化完成');
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },
  
  // 绑定网络事件
  bindEvents() {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.notifyListeners('online');
      this.startSync();
    });
    
    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.notifyListeners('offline');
    });
  },
  
  // 添加状态监听器
  addListener(callback) {
    this.listeners.push(callback);
  },
  
  // 移除监听器
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  },
  
  // 通知监听器
  notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (e) {
        console.error('OfflineSync: 监听器执行错误', e);
      }
    });
  },
  
  // 添加到同步队列
  async addToQueue(type, action, data) {
    const item = {
      id: this.generateId(),
      type, // 'project' | 'photo' | 'inspection' | 'voice' | 'video' | 'anomaly'
      action, // 'create' | 'update' | 'delete'
      data,
      syncStatus: 'pending',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(item);
      
      request.onsuccess = () => {
        this.updatePendingCount();
        this.notifyListeners('queueUpdated', { count: this.status.pendingCount });
        console.log('OfflineSync: 添加到同步队列', type, action);
        resolve(item);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },
  
  // 获取待同步队列
  async getPendingQueue() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const pending = (request.result || [])
          .filter(item => item.syncStatus === 'pending')
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        resolve(pending);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },
  
  // 更新待同步数量
  async updatePendingCount() {
    const queue = await this.getPendingQueue();
    this.status.pendingCount = queue.length;
    return this.status.pendingCount;
  },
  
  // 开始同步
  async startSync() {
    if (!this.status.isOnline || this.status.syncing) {
      return;
    }
    
    this.status.syncing = true;
    this.notifyListeners('syncStart');
    
    try {
      const queue = await this.getPendingQueue();
      console.log(`OfflineSync: 开始同步，共 ${queue.length} 条`);
      
      for (const item of queue) {
        await this.syncItem(item);
      }
      
      this.status.lastSyncTime = new Date().toISOString();
      this.notifyListeners('syncComplete', { count: queue.length });
    } catch (error) {
      console.error('OfflineSync: 同步失败', error);
      this.notifyListeners('syncError', { error });
    } finally {
      this.status.syncing = false;
      await this.updatePendingCount();
    }
  },
  
  // 同步单个项目
  async syncItem(item) {
    try {
      // 根据类型执行不同的同步逻辑
      switch (item.type) {
        case 'project':
          await this.syncProject(item);
          break;
        case 'photo':
          await this.syncPhoto(item);
          break;
        case 'inspection':
          await this.syncInspection(item);
          break;
        default:
          console.warn('OfflineSync: 未知同步类型', item.type);
      }
      
      // 同步成功，标记为已同步
      await this.markSynced(item.id);
    } catch (error) {
      console.error('OfflineSync: 同步项目失败', item, error);
      await this.markFailed(item.id, error.message);
    }
  },
  
  // 同步项目数据到localStorage
  async syncProject(item) {
    const { action, data } = item;
    
    switch (action) {
      case 'create':
        // 项目已通过Store创建，此处只是标记同步完成
        break;
      case 'update':
        Store.updateProject(data.id, data.updates);
        break;
      case 'delete':
        Store.deleteProject(data.id);
        break;
    }
  },
  
  // 同步照片数据
  async syncPhoto(item) {
    // 照片数据本身已在IndexedDB，只需更新关联的项目照片引用
    const { data } = item;
    if (data.projectId) {
      const project = Store.getProject(data.projectId);
      if (project) {
        // 更新项目中的照片引用
        const steps = project.steps || [];
        let photoFound = false;
        
        for (let i = 0; i < steps.length; i++) {
          if (steps[i].photos) {
            const photoIndex = steps[i].photos.findIndex(p => p.id === data.photoId);
            if (photoIndex !== -1) {
              steps[i].photos[photoIndex] = {
                ...steps[i].photos[photoIndex],
                synced: true,
                syncedAt: new Date().toISOString()
              };
              photoFound = true;
              break;
            }
          }
        }
        
        if (photoFound) {
          Store.updateProject(data.projectId, { steps });
        }
      }
    }
  },
  
  // 同步勘察数据
  async syncInspection(item) {
    const { action, data } = item;
    
    switch (action) {
      case 'create':
        break;
      case 'update':
        Store.updateInspection(data.id, data.updates);
        break;
    }
  },
  
  // 标记项目已同步
  async markSynced(itemId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const getRequest = store.get(itemId);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.syncStatus = 'synced';
          item.syncedAt = new Date().toISOString();
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (e) => reject(e.target.error);
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 标记项目同步失败
  async markFailed(itemId, error) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const getRequest = store.get(itemId);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retryCount++;
          if (item.retryCount >= item.maxRetries) {
            item.syncStatus = 'failed';
            item.error = error;
          }
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (e) => reject(e.target.error);
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 清理已同步项目
  async cleanSynced() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const synced = (request.result || []).filter(item => item.syncStatus === 'synced');
        synced.forEach(item => {
          store.delete(item.id);
        });
        console.log(`OfflineSync: 清理了 ${synced.length} 条已同步记录`);
        resolve(synced.length);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },
  
  // 检查存储容量
  async checkStorageCapacity() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usageMB = (estimate.usage / 1024 / 1024).toFixed(2);
      const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
      const usagePercent = ((estimate.usage / estimate.quota) * 100).toFixed(1);
      
      return {
        usage: estimate.usage,
        usageMB,
        quota: estimate.quota,
        quotaMB,
        usagePercent,
        isWarning: usagePercent > 80,
        isCritical: usagePercent > 95
      };
    }
    return null;
  },
  
  // 预加载当前用户数据
  async preloadUserData() {
    if (!this.status.isOnline) return;
    
    try {
      // 预加载项目数据到内存（已有的Store已做）
      // 预加载FAQ到IndexedDB
      await this.preloadFAQ();
      console.log('OfflineSync: 数据预加载完成');
    } catch (error) {
      console.error('OfflineSync: 预加载失败', error);
    }
  },
  
  // 预加载FAQ
  async preloadFAQ() {
    // FAQ数据由FAQSearch模块提供，此处只是确保缓存
    const faqData = window.FAQSearch?.getAllFAQs?.() || [];
    if (faqData.length > 0) {
      const transaction = this.db.transaction(['faq_cache'], 'readwrite');
      const store = transaction.objectStore('faq_cache');
      
      for (const faq of faqData) {
        store.put({ ...faq, cachedAt: new Date().toISOString() });
      }
    }
  },
  
  // 获取同步状态显示信息
  getStatusDisplay() {
    if (!this.status.isOnline) {
      return { icon: '🔴', text: '离线模式', color: '#ee0a24' };
    }
    if (this.status.pendingCount > 0) {
      return { icon: '🟡', text: `${this.status.pendingCount}条待同步`, color: '#ff976a' };
    }
    return { icon: '🟢', text: '已同步', color: '#07c160' };
  },
  
  // 工具方法
  generateId() {
    return 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  // 保存数据到本地（离线时使用）
  async saveOfflineData(type, data) {
    await this.addToQueue(type, 'update', data);
  },
  
  // 获取离线数据
  async getOfflineData(type, id) {
    const queue = await this.getPendingQueue();
    return queue.find(item => item.type === type && item.data.id === id);
  }
};

// 导出
window.OfflineSync = OfflineSync;
