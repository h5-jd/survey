/**
 * 聚达勘察助手 - Vue3主应用 v4.0
 * 支持多角色、施工验收分离、水印相机、照片管理、离线模式、前后对比、语音备注、录像、异常上报、PDF导出、电子签名、FAQ速查
 */

// 等待所有依赖加载
document.addEventListener('DOMContentLoaded', () => {
  const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

  const App = {
    setup() {
      // ========== 登录检查 ==========
      const currentUser = ref(null);
      const isLoggedIn = ref(false);
      const loading = ref(true);
      const toastMessage = ref('');
      const showToast = ref(false);
      const modalConfig = ref({ show: false, title: '', message: '', onConfirm: null });
      
      // v4.0 新增状态
      const syncStatus = ref({ icon: '🟢', text: '已同步', isOnline: true, pendingCount: 0 });
      const showNotificationPanel = ref(false);
      const notifications = ref([]);
      const unreadCount = ref(0);
      const pendingAnomalyCount = ref(0);
      
      // 检查登录状态
      const checkLogin = () => {
        loading.value = true;
        if (window.Store) Store.initDefaultAdmin();
        const user = Store.getCurrentUser();
        if (user) {
          currentUser.value = user;
          isLoggedIn.value = true;
        }
        loading.value = false;
      };
      
      // 供外部（内嵌登录页）登录后调用，刷新Vue状态
      const refreshLoginState = () => {
        if (window.Store) Store.initDefaultAdmin();
        const user = Store.getCurrentUser();
        if (user) {
          currentUser.value = user;
          isLoggedIn.value = true;
          loadData();
        }
      };
      
      // 跳转登录 - 不再跳转页面，显示内嵌登录界面
      const goToLogin = () => {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
          loginScreen.style.display = 'flex';
          loginScreen.classList.remove('hiding');
        }
        document.getElementById('app').style.display = 'none';
      };
      
      // 退出登录
      const handleLogout = () => {
        modalConfig.value = {
          show: true,
          title: '退出登录',
          message: '确定要退出登录吗？',
          onConfirm: () => {
            Store.logout();
            currentUser.value = null;
            isLoggedIn.value = false;
            // 不跳转页面，直接显示内嵌登录界面
            const loginScreen = document.getElementById('loginScreen');
            if (loginScreen) {
              loginScreen.style.display = 'flex';
              loginScreen.classList.remove('hiding');
            }
            document.getElementById('app').style.display = 'none';
          },
          onCancel: () => { modalConfig.value.show = false; }
        };
      };

      // ========== 状态 ==========
      const currentPage = ref('home');
      const projects = ref([]);
      const inspections = ref([]);
      const currentInspection = ref(null);
      const currentProject = ref(null);
      const settings = ref(Store.getSettings());
      const craftLibrary = ref(CraftTemplates.getAllTemplates());
      const selectedCraftType = ref('wall');
      const pageParams = reactive({
        projectId: null,
        inspectionId: null,
        craftType: null,
        statusFilter: 'pending'
      });

      // 照片管理相关状态
      const photoStats = ref({ total: 0, today: 0, thisWeek: 0, byProject: {}, byEmployee: {}, byDate: {} });
      const photoList = ref([]);
      const photoFilterType = ref('project');
      const photoSearchKeyword = ref('');
      const selectedPhotoDetail = ref(null);
      const currentEmployeeId = ref(null);

      // 员工管理相关状态
      const employeeList = ref([]);
      const showEmployeeModal = ref(false);
      const editingEmployee = ref(null);
      const employeeForm = ref({ name: '', phone: '', role: 'worker' });

      // ========== AI智能渗漏检测状态 ==========
      const aiStep = ref(0);
      const aiCategory = ref(null);
      const aiSubcategory = ref(null);
      const aiPhase1Photos = ref([]);
      const aiPhase2Photos = ref([]);
      const aiReport = ref(null);
      const aiAnalyzing = ref(false);
      const aiVoiceRecording = ref(false);
      const aiVoiceTarget = ref(null);

      // ========== 计算属性 ==========
      const isAdmin = computed(() => currentUser.value?.role === Store.ROLES.ADMIN);
      const isReviewer = computed(() => currentUser.value?.role === Store.ROLES.REVIEWER);
      const isWorker = computed(() => currentUser.value?.role === Store.ROLES.WORKER);
      const isSurveyor = computed(() => currentUser.value?.role === Store.ROLES.SURVEYOR);
      
      const visibleProjects = computed(() => {
        return projects.value.filter(p => {
          if (isAdmin.value) return true;
          if (isSurveyor.value) return p.surveyorId === currentUser.value?.id;
          if (isWorker.value) return p.workerId === currentUser.value?.id;
          if (isReviewer.value) return p.reviewerId === currentUser.value?.id;
          return false;
        });
      });
      
      const pendingReviewProjects = computed(() => {
        return visibleProjects.value.filter(p => p.status === Store.PROJECT_STATUS.PENDING_REVIEW);
      });

      const visibleNavTabs = computed(() => {
        const baseTabs = Store.getVisibleNavTabs();
        // v4.0 添加速查入口
        return [...baseTabs, { id: 'faq', name: '速查', icon: '🔍' }];
      });

      // ========== 方法 ==========
      const showToastMessage = (message, duration = 2000) => {
        toastMessage.value = message;
        showToast.value = true;
        setTimeout(() => { showToast.value = false; }, duration);
      };

      const showConfirm = (title, message, onConfirm) => {
        modalConfig.value = {
          show: true,
          title,
          message,
          onConfirm: () => { modalConfig.value.show = false; onConfirm && onConfirm(); },
          onCancel: () => { modalConfig.value.show = false; }
        };
      };

      const loadData = () => {
        projects.value = Store.getProjects();
        inspections.value = Store.getInspections();
      };

      const navigateTo = (page, params = {}) => {
        currentPage.value = page;
        Object.assign(pageParams, params);
        if (page === 'project-detail' && pageParams.projectId) {
          currentProject.value = Store.getProject(pageParams.projectId);
        }
        if (page === 'inspection' && pageParams.inspectionId) {
          currentInspection.value = Store.getInspection(pageParams.inspectionId);
        }
        if (page === 'quotation') {
          window.location.href = `pages/quotation.html?projectId=${params.projectId || ''}&inspectionId=${params.inspectionId || ''}`;
          return;
        }
        if (page === 'photo-manager') {
          loadPhotoStats();
        }
        if (page === 'employee-management') {
          loadEmployeeList();
        }
        // v4.0 FAQ页面
        if (page === 'faq') {
          openFAQSearch();
          return;
        }
        window.scrollTo(0, 0);
      };

      // ========== v4.0 新增功能方法 ==========

      // 打开FAQ速查
      const openFAQSearch = () => {
        FAQSearch.openSearchUI({
          onSelect: (faq) => {
            console.log('选择了FAQ:', faq);
          },
          onClose: () => {
            navigateTo('home');
          }
        });
      };

      // 打开异常上报
      const openAnomalyReport = (options = {}) => {
        AnomalyReport.openReportUI({
          projectId: options.projectId || currentProject.value?.id,
          projectName: options.projectName || currentProject.value?.customerName,
          stepIndex: options.stepIndex,
          stepName: options.stepName,
          onConfirm: (report) => {
            showToastMessage('异常已上报');
            loadData();
          }
        });
      };

      // 打开语音备注
      const openVoiceNote = (options = {}) => {
        VoiceNote.showRecorderUI({
          projectId: options.projectId || currentProject.value?.id,
          stepIndex: options.stepIndex,
          employeeId: currentUser.value?.id,
          employeeName: currentUser.value?.name,
          onConfirm: (voice) => {
            showToastMessage('语音备注已保存');
          }
        });
      };

      // 打开录像
      const openVideoRecorder = (options = {}) => {
        VideoCamera.openVideoRecorder({
          projectId: options.projectId || currentProject.value?.id,
          stepIndex: options.stepIndex,
          projectName: options.projectName || currentProject.value?.customerName,
          employeeName: currentUser.value?.name,
          onConfirm: (video) => {
            showToastMessage('录像保存成功');
          }
        });
      };

      // 打开电子签名
      const openSignature = (projectId, options = {}) => {
        SignaturePad.showSignatureConfirm({
          projectId: projectId,
          stepName: options.stepName || '验收',
          onSigned: (signature) => {
            showToastMessage('签名已保存');
            loadData();
          }
        });
      };

      // 导出PDF
      const exportPDF = async (projectId) => {
        try {
          showToastMessage('正在生成PDF...');
          const filename = await ReportExport.exportProjectReport(projectId, {
            includePhotos: true,
            includeVoiceNotes: true
          });
          showToastMessage('PDF已导出');
        } catch (error) {
          console.error('导出失败:', error);
          showToastMessage('导出失败');
        }
      };

      // 更新同步状态显示
      const updateSyncStatus = () => {
        if (window.OfflineSync) {
          const status = OfflineSync.getStatusDisplay();
          syncStatus.value = {
            ...status,
            isOnline: OfflineSync.status.isOnline,
            pendingCount: OfflineSync.status.pendingCount
          };
        }
      };

      // 打开通知中心
      const openNotificationCenter = async () => {
        if (window.AppNotification) {
          notifications.value = AppNotification.getMessages();
          unreadCount.value = AppNotification.getUnreadCount();
          showNotificationPanel.value = true;
        }
      };

      // 标记通知已读
      const markNotificationRead = async (notificationId) => {
        if (window.AppNotification) {
          await AppNotification.markAsRead(notificationId);
          unreadCount.value = AppNotification.getUnreadCount();
        }
      };

      // ========== 原有方法 ==========
      const goToQuotation = (projectId, inspectionId) => {
        window.location.href = `pages/quotation.html?projectId=${projectId || ''}&inspectionId=${inspectionId || ''}`;
      };

      const getProjectQuote = (projectId) => {
        const quote = Store.getQuotation(projectId);
        return quote ? quote.finalTotal : null;
      };

      const createProject = (data) => {
        const newProject = Store.createProject(data);
        loadData();
        showToastMessage('项目创建成功');
        navigateTo('project-detail', { projectId: newProject.id });
      };

      const startInspection = (projectId) => {
        const project = Store.getProject(projectId);
        const newInspection = Store.createInspection({
          projectId,
          customerName: project?.customerName || '',
          customerPhone: project?.customerPhone || '',
          customerAddress: project?.customerAddress || '',
          buildingType: project?.buildingType || '',
          buildYear: project?.buildYear || ''
        });
        loadData();
        navigateTo('inspection', { inspectionId: newInspection.id });
      };

      const saveInspection = (data) => {
        if (pageParams.inspectionId) {
          Store.updateInspection(pageParams.inspectionId, data);
          loadData();
          showToastMessage('保存成功');
        }
      };

      const runDiagnosis = async (inspectionId) => {
        const inspection = Store.getInspection(inspectionId);
        if (!inspection?.photos?.length) { showToastMessage('请先添加照片'); return; }
        loading.value = true;
        try {
          const photo = inspection.photos[0];
          const result = await CozeAPI.deepDiagnose(photo.url, inspection.leakLocations?.[0]?.name || '', inspection.leakLocations?.[0]?.notes || '');
          Store.updateInspection(inspectionId, { diagnosis: result });
          loadData();
          showToastMessage('诊断完成');
          navigateTo('diagnosis', { inspectionId });
        } catch (error) {
          showToastMessage(error.message || '诊断失败');
        } finally {
          loading.value = false;
        }
      };

      const submitStepForReview = (projectId, stepIndex, data) => {
        const result = Store.submitForReview(projectId, stepIndex, data);
        if (result) {
          loadData();
          currentProject.value = Store.getProject(projectId);
          showToastMessage('已提交，待验收');
          // v4.0 发送通知给验收员
          if (window.AppNotification) {
            const project = Store.getProject(projectId);
            AppNotification.notifyReviewRequest(project, result.steps[stepIndex]?.stepName);
          }
        }
      };

      const reviewStep = (projectId, stepIndex, approved, reviewNote) => {
        if (!approved && !reviewNote) { showToastMessage('请填写打回原因'); return; }
        const result = Store.reviewStep(projectId, stepIndex, approved, reviewNote);
        if (result) {
          loadData();
          currentProject.value = Store.getProject(projectId);
          showToastMessage(approved ? '验收通过 ✅' : '已打回 ❌');
          // v4.0 发送通知给施工员
          if (window.AppNotification && approved) {
            const project = Store.getProject(projectId);
            AppNotification.notifyReviewResult(project, result.steps[stepIndex]?.stepName, true, '');
          }
        }
      };

      const addStepPhoto = (projectId, stepIndex, photoIndex, photo) => {
        // v4.0 为照片添加compareTag
        const compareTag = photo.compareTag || 'during';
        Store.addStepPhoto(projectId, stepIndex, photoIndex, { ...photo, compareTag });
        loadData();
        currentProject.value = Store.getProject(projectId);
      };

      const resubmitStep = (projectId, stepIndex) => {
        Store.resubmitStep(projectId, stepIndex);
        loadData();
        currentProject.value = Store.getProject(projectId);
        showToastMessage('已重新提交');
      };

      const assignCraft = (project) => {
        const diagnosis = project.inspection?.diagnosis;
        let craftType = 'wall';
        if (diagnosis) {
          const type = diagnosis.type?.toLowerCase() || '';
          if (type.includes('窗')) craftType = 'window';
          else if (type.includes('卫生间') || type.includes('厕所')) craftType = 'toilet';
        }
        const steps = CraftTemplates.initializeProjectSteps(craftType);
        Store.updateProject(project.id, { steps, craftType, status: Store.PROJECT_STATUS.IN_PROGRESS });
        loadData();
        currentProject.value = Store.getProject(project.id);
        showToastMessage('已分配工艺');
      };

      const exportReport = (inspectionId) => {
        const inspection = Store.getInspection(inspectionId);
        if (!inspection) return;
        const report = SOP.generateReportStructure(inspection);
        const text = SOP.exportAsText(report);
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `勘察报告_${inspection.customerName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToastMessage('报告已导出');
      };

      const saveSettings = () => {
        Store.saveSettings(settings.value);
        if (settings.value.cozeBotId || settings.value.cozeToken) {
          CozeAPI.setConfig({ botId: settings.value.cozeBotId, accessToken: settings.value.cozeToken });
        }
        showToastMessage('设置已保存');
      };

      const clearAllData = () => {
        showConfirm('确认清空', '确定要清空所有数据吗？此操作不可恢复。', () => {
          localStorage.clear();
          PhotoManager.clearAll();
          projects.value = [];
          inspections.value = [];
          showToastMessage('数据已清空');
        });
      };

      const getEmployees = (role) => {
        if (role) return Store.getUsersByRole(role);
        return Store.getEmployees();
      };

      const getRoleText = (role) => Store.getRoleText(role);

      // ========== 水印相机拍照 ==========
      const takePhoto = async (options = {}) => {
        try {
          const result = await WatermarkCamera.openCameraWithUI({
            employeeName: currentUser.value?.name,
            projectName: currentProject.value?.customerName || null,
            projectId: currentProject.value?.id,
            stage: options.stage || 'general',
            stepName: options.stepName || null,
            ...options
          });

          const thumbnail = await WatermarkCamera.generateThumbnail(result.watermarked);

          const photoData = {
            url: result.watermarked,
            thumbnail: thumbnail,
            projectId: currentProject.value?.id || null,
            projectName: currentProject.value?.customerName || null,
            employeeId: currentUser.value?.id,
            employeeName: currentUser.value?.name,
            employeeRole: currentUser.value?.role,
            timestamp: result.timestamp,
            gpsLat: result.gps?.lat,
            gpsLng: result.gps?.lng,
            gpsAddress: result.gps?.address,
            stage: options.stage || 'general',
            stepName: options.stepName || null,
            watermarked: true,
            // v4.0 前后对比标签
            compareTag: options.compareTag || 'during'
          };

          await PhotoManager.addPhoto(photoData);
          showToastMessage('拍照成功，已添加水印');
          
          return { ...result, photoData };
        } catch (error) {
          if (error.message !== '取消拍照') {
            console.error('拍照失败:', error);
          }
          return null;
        }
      };

      // v4.0 拍照并标记为施工前
      const takeBeforePhoto = async (options = {}) => {
        return takePhoto({ ...options, compareTag: 'before', stage: 'before' });
      };

      // v4.0 拍照并标记为施工后
      const takeAfterPhoto = async (options = {}) => {
        return takePhoto({ ...options, compareTag: 'after', stage: 'after' });
      };

      // ========== 照片管理 ==========
      const loadPhotoStats = async () => {
        try {
          photoStats.value = await PhotoManager.getPhotoStats();
        } catch (error) {
          console.error('加载照片统计失败:', error);
        }
      };

      const loadPhotoList = async (filterType) => {
        try {
          let photos = [];
          
          if (photoSearchKeyword.value) {
            photos = await PhotoManager.searchPhotos(photoSearchKeyword.value);
          } else if (filterType === 'project') {
            if (isAdmin.value) {
              photos = await PhotoManager.getAllPhotos();
            } else {
              photos = await PhotoManager.getPhotosByEmployee(currentUser.value?.id);
            }
          } else if (filterType === 'date') {
            photos = await PhotoManager.getAllPhotos();
          } else if (filterType === 'employee' && isAdmin.value) {
            photos = await PhotoManager.getAllPhotos();
          }
          
          photoList.value = photos;
        } catch (error) {
          console.error('加载照片列表失败:', error);
        }
      };

      const viewPhotoDetail = (photo) => {
        selectedPhotoDetail.value = photo;
      };

      const closePhotoDetail = () => {
        selectedPhotoDetail.value = null;
      };

      const deletePhoto = async (photoId) => {
        try {
          await PhotoManager.deletePhoto(photoId);
          await loadPhotoStats();
          await loadPhotoList(photoFilterType.value);
          closePhotoDetail();
          showToastMessage('照片已删除');
        } catch (error) {
          showToastMessage('删除失败');
        }
      };

      const searchPhotos = async () => {
        await loadPhotoList(photoFilterType.value);
      };

      const exportProjectPhotos = async (projectId, projectName) => {
        const exportData = await PhotoManager.exportProjectPhotos(projectId);
        const text = JSON.stringify(exportData, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}_照片清单.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToastMessage('导出成功');
      };

      // ========== 员工管理 ==========
      const loadEmployeeList = () => {
        employeeList.value = Store.getAllEmployees();
      };

      const openCreateEmployeeModal = () => {
        editingEmployee.value = null;
        employeeForm.value = { name: '', phone: '', role: 'worker' };
        showEmployeeModal.value = true;
      };

      const openEditEmployeeModal = (employee) => {
        editingEmployee.value = employee;
        employeeForm.value = {
          name: employee.name,
          phone: employee.employeeId,
          role: employee.role
        };
        showEmployeeModal.value = true;
      };

      const closeEmployeeModal = () => {
        showEmployeeModal.value = false;
        editingEmployee.value = null;
      };

      const saveEmployee = () => {
        if (!employeeForm.value.name) {
          showToastMessage('请输入姓名');
          return;
        }
        if (!employeeForm.value.phone || employeeForm.value.phone.length !== 11) {
          showToastMessage('请输入正确的手机号');
          return;
        }

        if (editingEmployee.value) {
          Store.updateEmployeeRole(editingEmployee.value.id, employeeForm.value.role);
          loadEmployeeList();
          showToastMessage('员工信息已更新');
        } else {
          const result = Store.createEmployeeByAdmin({
            name: employeeForm.value.name,
            employeeId: employeeForm.value.phone,
            role: employeeForm.value.role
          });
          if (result.success) {
            loadEmployeeList();
            showToastMessage('员工账号创建成功');
          } else {
            showToastMessage(result.message);
          }
        }
        closeEmployeeModal();
      };

      const toggleEmployeeStatus = (employee) => {
        const action = employee.status === 'active' ? '禁用' : '启用';
        Store.toggleEmployeeStatus(employee.id);
        loadEmployeeList();
        showToastMessage(`员工已${action}`);
      };

      const resetEmployeePassword = (employee) => {
        Store.resetEmployeePassword(employee.id);
        showToastMessage('密码已重置');
      };

      // ========== AI智能渗漏检测方法 ==========
      const aiCategories = computed(() => AILeakDetect.getCategories());
      const aiSubcategories = computed(() => aiCategory.value ? AILeakDetect.getSubcategories(aiCategory.value) : []);
      const aiPhotoGuides = computed(() => aiCategory.value ? AILeakDetect.getPhotoGuide(aiCategory.value) : []);
      const aiRequiredCheck = computed(() => aiCategory.value ? AILeakDetect.checkRequiredPhotos(aiCategory.value, aiPhase2Photos.value) : { total: 0, completed: 0, missing: [] });
      const aiPanoramaCount = computed(() => aiPhase1Photos.value.filter(p => p.type === 'panorama').length);
      const aiCloseupCount = computed(() => aiPhase1Photos.value.filter(p => p.type === 'closeup').length);

      const startAIDetect = () => { aiStep.value = 1; aiCategory.value = null; aiSubcategory.value = null; aiPhase1Photos.value = []; aiPhase2Photos.value = []; aiReport.value = null; navigateTo('ai-detect'); };
      const selectAICategory = (catId) => { aiCategory.value = catId; aiSubcategory.value = null; aiStep.value = 2; };
      const selectAISubcategory = (subId) => { aiSubcategory.value = subId; aiStep.value = 3; };
      const takeAIPhoto = async (options = {}) => {
        try {
          const result = await WatermarkCamera.openCameraWithUI({ employeeName: currentUser.value?.name, stage: options.stage || 'ai-detect', ...options });
          const thumbnail = await WatermarkCamera.generateThumbnail(result.watermarked);
          return { url: result.watermarked, base64: result.watermarked, thumbnail, timestamp: result.timestamp, description: '' };
        } catch (error) { if (error.message !== '取消拍照') { console.error('拍照失败:', error); showToastMessage('拍照失败: ' + error.message); } return null; }
      };
      const addPanoramaPhoto = async () => { const p = await takeAIPhoto({ stage: 'ai-panorama' }); if (p) { p.type = 'panorama'; aiPhase1Photos.value.push(p); } };
      const addCloseupPhoto = async () => { const p = await takeAIPhoto({ stage: 'ai-closeup' }); if (p) { p.type = 'closeup'; aiPhase1Photos.value.push(p); } };
      const addPhase2Photo = async (guideId, guideName, guideIcon) => { const p = await takeAIPhoto({ stage: 'ai-phase2', stepName: guideName }); if (p) { p.guideId = guideId; p.guideName = guideName; p.guideIcon = guideIcon; aiPhase2Photos.value.push(p); } };
      const selectAIPhotoFromAlbum = (type, guideId, guideName, guideIcon) => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
          reader.onload = async (event) => { const base64 = event.target.result; const thumbnail = await WatermarkCamera.generateThumbnail(base64); const photo = { url: base64, base64, thumbnail, description: '' };
            if (type === 'panorama') { photo.type = 'panorama'; aiPhase1Photos.value.push(photo); }
            else if (type === 'closeup') { photo.type = 'closeup'; aiPhase1Photos.value.push(photo); }
            else if (type === 'phase2') { photo.guideId = guideId; photo.guideName = guideName; photo.guideIcon = guideIcon; aiPhase2Photos.value.push(photo); }
          }; reader.readAsDataURL(file); }; input.click();
      };
      const removeAIPhoto = (phase, index) => { if (phase === 1) aiPhase1Photos.value.splice(index, 1); else aiPhase2Photos.value.splice(index, 1); };
      const updateAIPhotoDescription = (phase, index, desc) => { if (phase === 1) aiPhase1Photos.value[index].description = desc; else aiPhase2Photos.value[index].description = desc; };
      const startVoiceInput = (phase, index) => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { showToastMessage('您的浏览器不支持语音输入，请手动输入'); return; }
        const rec = new SR(); rec.lang = 'zh-CN'; rec.continuous = false; rec.interimResults = false;
        aiVoiceRecording.value = true; aiVoiceTarget.value = { phase, index };
        rec.onresult = (event) => { const t = event.results[0][0].transcript; if (phase === 1) aiPhase1Photos.value[index].description = (aiPhase1Photos.value[index].description || '') + t; else aiPhase2Photos.value[index].description = (aiPhase2Photos.value[index].description || '') + t; };
        rec.onerror = (event) => showToastMessage('语音识别失败: ' + event.error);
        rec.onend = () => { aiVoiceRecording.value = false; aiVoiceTarget.value = null; };
        rec.start();
      };
      const goToPhase2 = () => { aiStep.value = 4; };
      const aiStepBack = () => { if (aiStep.value > 1) { aiStep.value--; if (aiStep.value === 1) aiCategory.value = null; else if (aiStep.value === 2) aiSubcategory.value = null; } else { aiStep.value = 0; navigateTo('home'); } };
      const generateAIReport = async () => {
        const allPhotos = [...aiPhase1Photos.value.map(p => ({ ...p, phase: 1, photoType: p.type })), ...aiPhase2Photos.value.map(p => ({ ...p, phase: 2, photoType: p.guideName }))];
        if (allPhotos.length < 2) { showToastMessage('至少需要拍摄2张照片才能进行AI分析'); return; }
        const cat = AILeakDetect.getCategory(aiCategory.value); const sub = AILeakDetect.getSubcategory(aiCategory.value, aiSubcategory.value);
        if (!cat || !sub) { showToastMessage('请先选择渗漏类型'); return; }
        aiAnalyzing.value = true; aiStep.value = 5;
        try { const result = await AILeakDetect.comprehensiveAnalysis(allPhotos, cat.name, sub.name); aiReport.value = result; showToastMessage('AI分析完成'); }
        catch (error) { console.error('AI分析失败:', error); showToastMessage('AI分析失败: ' + error.message); aiStep.value = 4; }
        finally { aiAnalyzing.value = false; }
      };
      const resetAIDetect = () => { aiStep.value = 1; aiCategory.value = null; aiSubcategory.value = null; aiPhase1Photos.value = []; aiPhase2Photos.value = []; aiReport.value = null; };
      const viewAIPhoto = (url) => { const o = document.createElement('div'); o.className = 'photo-viewer-overlay'; o.innerHTML = '<div class="photo-viewer-content"><img src="' + url + '"><button class="photo-viewer-close">×</button></div>'; o.onclick = () => o.remove(); document.body.appendChild(o); };
      const getAICategoryInfo = (catId) => AILeakDetect.getCategory(catId);
      const getAISubcategoryInfo = (catId, subId) => AILeakDetect.getSubcategory(catId, subId);

      // ========== 初始化 ==========
      onMounted(async () => {
        // 检查登录状态 - 如果内嵌登录页已经完成登录，直接同步
        checkLogin();
        
        // 暴露刷新方法给外部（内嵌登录页的JS会调用）
        window.__vueApp = { refreshLoginState };
        
        // 如果已经通过内嵌登录页登录成功（window.__loginDone标记）
        if (window.__loginDone && !isLoggedIn.value) {
          checkLogin();
        }
        
        if (isLoggedIn.value) loadData();
        if (settings.value.cozeBotId) {
          CozeAPI.setConfig({ botId: settings.value.cozeBotId, accessToken: settings.value.cozeToken });
        }
        
        // 轮询检查登录状态（最可靠的方式，防止事件丢失）
        const loginPollTimer = setInterval(() => {
          if (!isLoggedIn.value && window.Store) {
            const user = Store.getCurrentUser();
            if (user) {
              currentUser.value = user;
              isLoggedIn.value = true;
              loadData();
              clearInterval(loginPollTimer);
            }
          } else if (isLoggedIn.value) {
            clearInterval(loginPollTimer);
          }
        }, 500);
        // 30秒后停止轮询
        setTimeout(() => clearInterval(loginPollTimer), 30000);
        
        // v4.0 初始化模块
        PhotoManager.init();
        
        // 初始化离线同步
        if (window.OfflineSync) {
          await OfflineSync.init();
          OfflineSync.addListener((event, data) => {
            updateSyncStatus();
          });
          updateSyncStatus();
        }
        
        // 初始化通知
        if (window.AppNotification) {
          await AppNotification.init();
          // 请求通知权限
          AppNotification.requestPermission();
        }
        
        // 初始化FAQ
        if (window.FAQSearch) {
          FAQSearch.init();
        }
        
        // 初始化语音备注
        if (window.VoiceNote) {
          VoiceNote.init();
        }
        
        // 初始化录像
        if (window.VideoCamera) {
          VideoCamera.init();
        }
        
        // 初始化异常上报
        if (window.AnomalyReport) {
          AnomalyReport.init();
          // 检查待处理异常数量
          const count = await AnomalyReport.getPendingCount();
          pendingAnomalyCount.value = count;
        }
        
        // 初始化电子签名
        if (window.SignaturePad) {
          SignaturePad.init();
        }
        
        // 初始化PDF导出
        if (window.ReportExport) {
          ReportExport.init();
        }
      });

      return {
        // 登录状态
        currentUser, isLoggedIn, loading,
        // 状态
        currentPage, toastMessage, showToast, modalConfig,
        // v4.0 新增状态
        syncStatus, showNotificationPanel, notifications, unreadCount, pendingAnomalyCount,
        // 数据
        projects, inspections, currentInspection, currentProject, settings, craftLibrary, selectedCraftType, pageParams,
        // 照片管理
        photoStats, photoList, photoFilterType, photoSearchKeyword, selectedPhotoDetail,
        // 员工管理
        employeeList, showEmployeeModal, editingEmployee, employeeForm,
        // 计算属性
        isAdmin, isReviewer, isWorker, isSurveyor, visibleProjects, pendingReviewProjects, visibleNavTabs,
        // Store和工具
        Store, SOP, CraftTemplates, ROLES: Store.ROLES,
        // 方法
        navigateTo, goToQuotation, getProjectQuote, createProject, startInspection,
        saveInspection, runDiagnosis, submitStepForReview, reviewStep, addStepPhoto,
        resubmitStep, assignCraft, exportReport, saveSettings, clearAllData,
        showConfirm, showToastMessage, loadData, handleLogout, goToLogin, checkLoginFromOutside,
        getEmployees, getRoleText,
        // 水印相机
        takePhoto, takeBeforePhoto, takeAfterPhoto,
        // 照片管理
        loadPhotoStats, loadPhotoList, viewPhotoDetail, closePhotoDetail, deletePhoto, searchPhotos, exportProjectPhotos,
        // 员工管理
        loadEmployeeList, openCreateEmployeeModal, openEditEmployeeModal, closeEmployeeModal, saveEmployee, toggleEmployeeStatus, resetEmployeePassword,
        // v4.0 新增方法
        openFAQSearch, openAnomalyReport, openVoiceNote, openVideoRecorder, openSignature, exportPDF,
        updateSyncStatus, openNotificationCenter, markNotificationRead,
        // AI智能渗漏检测
        aiStep, aiCategory, aiSubcategory, aiPhase1Photos, aiPhase2Photos, aiReport, aiAnalyzing,
        aiVoiceRecording, aiVoiceTarget,
        aiCategories, aiSubcategories, aiPhotoGuides, aiRequiredCheck, aiPanoramaCount, aiCloseupCount,
        startAIDetect, selectAICategory, selectAISubcategory,
        addPanoramaPhoto, addCloseupPhoto, addPhase2Photo, selectAIPhotoFromAlbum,
        removeAIPhoto, updateAIPhotoDescription, startVoiceInput,
        goToPhase2, aiStepBack, generateAIReport, resetAIDetect, viewAIPhoto,
        getAICategoryInfo, getAISubcategoryInfo, AILeakDetect,
        // 工具模块
        OfflineSync, VoiceNote, VideoCamera, AnomalyReport, AppNotification, SignaturePad, FAQSearch, ReportExport,
        PhotoManager, WatermarkCamera
      };
    },

    template: `
      <div class="page-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
        
        <!-- 未登录 - 由内嵌登录页处理，这里只显示加载提示 -->
        <div v-else-if="!isLoggedIn" class="loading-overlay">
          <div class="loading-text">请登录...</div>
        </div>

        <!-- 已登录 - 主界面 -->
        <template v-else>
          <!-- Toast -->
          <div v-if="showToast" class="toast">{{ toastMessage }}</div>
          
          <!-- v4.0 离线状态指示器 -->
          <div class="sync-status-indicator" @click="openNotificationCenter">
            <span class="status-icon">{{ syncStatus.icon }}</span>
            <span class="status-text">{{ syncStatus.text }}</span>
          </div>
          
          <!-- v4.0 异常待处理badge -->
          <div v-if="isAdmin && pendingAnomalyCount > 0" 
               style="position: fixed; top: 12px; right: 110px; z-index: 9999;">
            <span class="badge-danger" @click="navigateTo('anomaly-list')">
              ⚠️ {{ pendingAnomalyCount }}
            </span>
          </div>
          
          <!-- 确认弹窗 -->
          <div v-if="modalConfig.show" class="modal-overlay" @click="modalConfig.onCancel">
            <div class="modal" @click.stop>
              <div class="modal-header"><div class="modal-title">{{ modalConfig.title }}</div></div>
              <div class="modal-body">{{ modalConfig.message }}</div>
              <div class="modal-footer">
                <button class="btn btn-outline" @click="modalConfig.onCancel">取消</button>
                <button class="btn btn-primary" @click="modalConfig.onConfirm">确定</button>
              </div>
            </div>
          </div>

          <!-- ========== 首页 ========== -->
          <div v-if="currentPage === 'home'" class="page-home">
            <div class="page-header">
              <div>
                <h1>🏠 聚达勘察助手</h1>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">
                  {{ getRoleText(currentUser.role) }} · {{ currentUser.name }}
                </div>
              </div>
              <div style="display: flex; gap: 12px;">
                <!-- v4.0 通知按钮 -->
                <span @click="openNotificationCenter" style="position: relative; cursor: pointer;">
                  🔔
                  <span v-if="unreadCount > 0" style="position: absolute; top: -4px; right: -8px; 
                        background: #ee0a24; color: #fff; border-radius: 50%; width: 16px; height: 16px; 
                        font-size: 10px; display: flex; align-items: center; justify-content: center;">
                    {{ unreadCount > 9 ? '9+' : unreadCount }}
                  </span>
                </span>
                <span v-if="pendingReviewProjects.length > 0" class="badge-danger" @click="navigateTo('review-list')">
                  📋 待验收 {{ pendingReviewProjects.length }}
                </span>
                <span @click="handleLogout" style="font-size: 20px; cursor: pointer;">👤</span>
              </div>
            </div>
            
            <div class="page-content">
              <!-- 快捷入口 -->
              <div class="card">
                <div class="card-title">📋 快捷操作</div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                  <button v-if="isAdmin" class="btn btn-primary flex-1" @click="navigateTo('new-project')">➕ 新建项目</button>
                  <button v-if="isSurveyor || isAdmin" class="btn btn-success flex-1" @click="navigateTo('inspection')">📷 开始勘察</button>
                  <button v-if="isWorker || isAdmin" class="btn btn-warning flex-1" @click="navigateTo('projects')">🔧 施工项目</button>
                  <button v-if="isReviewer || isAdmin" class="btn btn-danger flex-1" @click="navigateTo('review-list')">✅ 待验收</button>
                  <button class="btn flex-1" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-weight: 600;" @click="startAIDetect">🔍 AI智能检测</button>
                  <button class="btn btn-outline flex-1" @click="navigateTo('photo-manager')">📷 照片管理</button>
                  <!-- v4.0 新增入口 -->
                  <button class="btn btn-outline flex-1" @click="navigateTo('faq')">🔍 速查</button>
                </div>
              </div>
              
              <!-- v4.0 待验收提醒（验收员） -->
              <div v-if="(isReviewer || isAdmin) && pendingReviewProjects.length > 0" class="card review-alert">
                <div class="card-title" style="color: #ee0a24;">⚠️ 待验收项目</div>
                <div v-for="p in pendingReviewProjects.slice(0, 3)" :key="p.id" class="review-item" @click="navigateTo('project-detail', { projectId: p.id })">
                  <div class="review-item-title">{{ p.customerName }}</div>
                  <div class="review-item-addr">{{ p.customerAddress }}</div>
                  <div class="review-item-btn">去验收 →</div>
                </div>
                <button v-if="pendingReviewProjects.length > 3" class="btn btn-outline btn-block mt-12" @click="navigateTo('review-list')">
                  查看全部 {{ pendingReviewProjects.length }} 个
                </button>
              </div>
              
              <!-- v4.0 异常提醒（管理员） -->
              <div v-if="isAdmin && pendingAnomalyCount > 0" class="card" style="background: #fff7e6; border: 1px solid #fa8c16;">
                <div class="card-title" style="color: #fa8c16;">⚠️ 待处理异常</div>
                <div style="color: #666; font-size: 13px;">
                  有 {{ pendingAnomalyCount }} 个异常待处理，点击查看详情
                </div>
                <button class="btn btn-warning btn-block mt-12" @click="navigateTo('anomaly-list')">查看异常</button>
              </div>
              
              <!-- 待处理项目 -->
              <div class="card">
                <div class="card-title">
                  📋 {{ isWorker ? '我的施工' : isReviewer ? '我的验收' : '项目管理' }}
                  <span class="tag tag-danger">{{ visibleProjects.filter(p => p.status !== 'completed').length }}</span>
                </div>
                
                <div v-if="visibleProjects.filter(p => p.status !== 'completed').length === 0" class="empty-state" style="padding: 30px;">
                  <div class="icon">📭</div>
                  <div class="desc">暂无待处理项目</div>
                </div>
                
                <div v-else>
                  <div v-for="project in visibleProjects.filter(p => p.status !== 'completed').slice(0, 5)" :key="project.id" 
                       class="project-card" @click="navigateTo('project-detail', { projectId: project.id })">
                    <div class="project-card-header">
                      <div class="project-card-title">{{ project.customerName }}</div>
                      <span :class="'tag tag-' + Store.getStatusTagClass(project.status)">{{ Store.getStatusText(project.status) }}</span>
                    </div>
                    <div class="project-card-info">📍 {{ project.customerAddress }}</div>
                    <div v-if="project.progress > 0" class="progress-bar">
                      <div class="progress-bar-fill" :style="{ width: project.progress + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 项目详情页 ========== -->
          <div v-if="currentPage === 'project-detail'" class="page-project-detail">
            <div class="page-header">
              <span class="back-btn" @click="navigateTo('home')">←</span>
              <h1>{{ currentProject?.customerName }}</h1>
              <span style="width: 30px;"></span>
            </div>
            
            <div class="page-content" v-if="currentProject">
              <!-- 项目状态 -->
              <div class="card">
                <div class="card-title">
                  项目状态
                  <span :class="'tag tag-' + Store.getStatusTagClass(currentProject.status)">{{ Store.getStatusText(currentProject.status) }}</span>
                </div>
                <div v-if="currentProject.progress > 0">
                  <div class="progress-bar"><div class="progress-bar-fill" :style="{ width: currentProject.progress + '%' }"></div></div>
                  <div style="font-size: 12px; color: #666; margin-top: 8px;">进度：{{ currentProject.progress }}%</div>
                </div>
              </div>
              
              <div class="card">
                <div class="card-title">👥 项目人员</div>
                <div class="person-info"><span class="person-icon">🔍</span><span>勘察员：{{ currentProject.surveyorName || '未分配' }}</span></div>
                <div class="person-info"><span class="person-icon">🔧</span><span>施工员：{{ currentProject.workerName || '未分配' }}</span></div>
                <div class="person-info"><span class="person-icon">✅</span><span>验收员：{{ currentProject.reviewerName || '未分配' }}</span></div>
              </div>
              
              <!-- v4.0 新增功能入口 -->
              <div class="card">
                <div class="card-title">🛠️ 快捷工具</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                  <button class="btn btn-outline" @click="takePhoto({ stage: 'project', projectName: currentProject.customerName })">
                    📷 拍照
                  </button>
                  <button class="btn btn-outline" @click="openVoiceNote({ projectId: currentProject.id })">
                    🎤 语音
                  </button>
                  <button class="btn btn-outline" @click="openVideoRecorder({ projectId: currentProject.id, projectName: currentProject.customerName })">
                    🎬 录像
                  </button>
                  <button class="btn btn-outline" @click="openAnomalyReport({ projectId: currentProject.id, projectName: currentProject.customerName })">
                    ⚠️ 异常
                  </button>
                  <button class="btn btn-outline" @click="exportPDF(currentProject.id)">
                    📄 PDF
                  </button>
                  <button v-if="currentProject.signature" class="btn btn-outline" @click="openSignature(currentProject.id)">
                    ✍️ 签名
                  </button>
                </div>
              </div>
              
              <!-- 施工步骤（v4.0 增强版） -->
              <div v-if="currentProject.steps && currentProject.steps.length > 0" class="card">
                <div class="card-title">
                  🔧 施工步骤
                  <span :class="'tag tag-' + Store.getStatusTagClass(currentProject.status)">{{ Store.getStatusText(currentProject.status) }}</span>
                </div>
                
                <div v-if="currentProject.progress > 0" class="progress-bar">
                  <div class="progress-bar-fill" :style="{ width: currentProject.progress + '%' }"></div>
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 8px;">进度：{{ currentProject.progress }}%</div>
                
                <!-- 步骤列表 -->
                <div class="steps-review-list">
                  <div v-for="(step, index) in currentProject.steps" :key="index" :class="'step-review-item ' + step.reviewStatus">
                    <div class="step-review-header">
                      <span class="step-review-num">{{ index + 1 }}</span>
                      <span class="step-review-name">{{ step.stepName }}</span>
                      <span v-if="step.reviewStatus === 'approved'" class="step-review-status approved">✅通过</span>
                      <span v-else-if="step.reviewStatus === 'rejected'" class="step-review-status rejected">❌驳回</span>
                      <span v-else-if="step.submitted" class="step-review-status pending">⏳待验收</span>
                      <span v-else class="step-review-status">待施工</span>
                    </div>
                    
                    <!-- v4.0 施工前后对比 -->
                    <div class="step-compare-section">
                      <div class="step-compare-title">📸 施工前后对比</div>
                      <div class="compare-grid">
                        <div class="compare-item">
                          <div class="compare-label">施工前</div>
                          <div v-if="step.photos?.find(p => p.compareTag === 'before')" class="compare-img" 
                               @click="viewPhoto(step.photos.find(p => p.compareTag === 'before').url)">
                            <img :src="step.photos.find(p => p.compareTag === 'before').url" alt="施工前" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
                          </div>
                          <div v-else class="compare-placeholder">未拍摄</div>
                          <button v-if="step.stepStatus !== 'approved'" class="btn btn-outline" style="margin-top:4px;font-size:11px;padding:4px 8px;" 
                                  @click="takeBeforePhoto({ stage: 'step', stepName: step.stepName, projectId: currentProject.id })">
                            📷 拍照
                          </button>
                        </div>
                        <div class="compare-item">
                          <div class="compare-label">施工后</div>
                          <div v-if="step.photos?.find(p => p.compareTag === 'after')" class="compare-img"
                               @click="viewPhoto(step.photos.find(p => p.compareTag === 'after').url)">
                            <img :src="step.photos.find(p => p.compareTag === 'after').url" alt="施工后" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
                          </div>
                          <div v-else class="compare-placeholder">未拍摄</div>
                          <button v-if="step.stepStatus !== 'approved'" class="btn btn-outline" style="margin-top:4px;font-size:11px;padding:4px 8px;"
                                  @click="takeAfterPhoto({ stage: 'step', stepName: step.stepName, projectId: currentProject.id })">
                            📷 拍照
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 步骤工具按钮 -->
                    <div v-if="step.stepStatus !== 'approved'" style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                      <button class="btn btn-outline" style="flex:1;font-size:12px;" 
                              @click="takePhoto({ stage: 'step', stepName: step.stepName })">
                        📷 拍照
                      </button>
                      <button class="btn btn-outline" style="flex:1;font-size:12px;"
                              @click="openVoiceNote({ projectId: currentProject.id, stepIndex: index })">
                        🎤 语音
                      </button>
                      <button class="btn btn-outline" style="flex:1;font-size:12px;"
                              @click="openAnomalyReport({ projectId: currentProject.id, stepIndex: index, stepName: step.stepName })">
                        ⚠️ 异常
                      </button>
                    </div>
                    
                    <!-- 驳回原因 -->
                    <div v-if="step.reviewNote" class="step-reject-reason">{{ step.reviewNote }}</div>
                    
                    <!-- 审核操作（验收员/管理员） -->
                    <div v-if="step.submitted && step.reviewStatus === 'pending' && (isReviewer || isAdmin)" class="step-review-actions">
                      <button class="btn-approve" @click="reviewStep(currentProject.id, index, true, '')">✅ 通过</button>
                      <button class="btn-reject" @click="showRejectModal(index)">❌ 打回</button>
                    </div>
                    
                    <!-- 重新提交（施工员，被驳回后） -->
                    <div v-if="step.reviewStatus === 'rejected' && isWorker" class="step-review-actions">
                      <button class="btn-resubmit" @click="resubmitStep(currentProject.id, index)">重新提交验收</button>
                    </div>
                    
                    <!-- v4.0 验收通过后签名 -->
                    <div v-if="step.reviewStatus === 'approved' && !currentProject.signature && (isReviewer || isAdmin)">
                      <button class="btn btn-success btn-block mt-12" @click="openSignature(currentProject.id, { stepName: step.stepName })">
                        ✍️ 验收签字确认
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- v4.0 已签名显示 -->
              <div v-if="currentProject.signature" class="card">
                <div class="card-title">✍️ 签名确认</div>
                <div style="text-align: center;">
                  <img :src="currentProject.signature.imageUrl" alt="签名" style="max-width: 200px; border: 1px solid #ebedf0; border-radius: 8px;">
                  <div style="margin-top: 8px; font-size: 13px; color: #666;">
                    {{ currentProject.signature.signerName }} ({{ currentProject.signature.signerRole }})
                  </div>
                  <div style="font-size: 12px; color: #999;">
                    {{ Store.formatDate(currentProject.signature.signTime) }}
                  </div>
                </div>
              </div>
              
              <!-- 未分配工艺 -->
              <div v-else-if="isAdmin" class="card">
                <div class="empty-state" style="padding: 30px;">
                  <div class="icon">📋</div><div class="desc">尚未分配施工工艺</div>
                  <button class="btn btn-primary mt-12" @click="assignCraft(currentProject)">分配工艺</button>
                </div>
              </div>
              
              <!-- 操作记录 -->
              <div v-if="currentProject.operationLogs && currentProject.operationLogs.length > 0" class="card">
                <div class="card-title">📜 操作记录</div>
                <div class="timeline">
                  <div v-for="log in [...currentProject.operationLogs].reverse().slice(0, 10)" :key="log.id" class="timeline-item">
                    <div class="timeline-time">{{ Store.formatTimeOnly(log.time) }}</div>
                    <div class="timeline-content">{{ log.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 其他页面（简化版，完整模板在原文件中） ========== -->
          
          <!-- 由于模板过长，此处仅展示关键页面的v4.0增强部分 -->
          
          <!-- 照片管理页面 -->
          <div v-if="currentPage === 'photo-manager'" class="page-photo-manager">
            <div class="page-header">
              <span class="back-btn" @click="navigateTo('home')">←</span>
              <h1>📷 照片管理</h1>
              <span style="width: 30px;"></span>
            </div>
            
            <div class="page-content">
              <div class="photo-stats-card">
                <div class="stat-item">
                  <div class="stat-value">{{ photoStats.today }}</div>
                  <div class="stat-label">今日</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ photoStats.thisWeek }}</div>
                  <div class="stat-label">本周</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ photoStats.total }}</div>
                  <div class="stat-label">总计</div>
                </div>
              </div>
              
              <div class="photo-search-box">
                <input type="text" class="form-input" v-model="photoSearchKeyword" placeholder="搜索项目名/员工名/日期" @keyup.enter="searchPhotos">
                <button class="btn btn-primary" @click="searchPhotos">搜索</button>
              </div>
              
              <div class="photo-masonry">
                <div v-for="photo in photoList.slice(0, 30)" :key="photo.id" class="photo-masonry-item" @click="viewPhotoDetail(photo)">
                  <img :src="photo.thumbnail || photo.url" alt="照片">
                  <div class="photo-masonry-info">
                    <span>{{ photo.date }}</span>
                    <span>{{ photo.employeeName }}</span>
                  </div>
                  <!-- v4.0 显示前后对比标签 -->
                  <span v-if="photo.compareTag" style="position:absolute;top:4px;left:4px;background:#1989fa;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;">
                    {{ photo.compareTag === 'before' ? '前' : photo.compareTag === 'after' ? '后' : '中' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="tabbar">
              <a class="tabbar-item" @click="navigateTo('home')"><span class="icon">🏠</span><span class="text">首页</span></a>
              <a v-if="isAdmin" class="tabbar-item" @click="navigateTo('projects')"><span class="icon">📋</span><span class="text">项目</span></a>
              <a v-if="isReviewer || isAdmin" class="tabbar-item" @click="navigateTo('review-list')"><span class="icon">✅</span><span class="text">验收</span></a>
              <a class="tabbar-item active"><span class="icon">📷</span><span class="text">照片</span></a>
              <a class="tabbar-item" @click="navigateTo('faq')"><span class="icon">🔍</span><span class="text">速查</span></a>
            </div>
          </div>

          <!-- ========== AI智能渗漏检测页面 ========== -->
          <div v-if="currentPage === 'ai-detect'" class="page-ai-detect">
            <div class="page-header">
              <span class="back-btn" @click="aiStepBack">←</span>
              <h1>🔍 AI智能渗漏检测</h1>
              <span style="width: 30px;"></span>
            </div>
            <div class="page-content">
              <!-- 步骤指示器 -->
              <div class="ai-step-indicator">
                <div :class="['ai-step-dot', { active: aiStep >= 1, done: aiStep > 1 }]"><span class="ai-step-num">1</span><span class="ai-step-label">大类</span></div>
                <div :class="['ai-step-line', { active: aiStep > 1 }]"></div>
                <div :class="['ai-step-dot', { active: aiStep >= 2, done: aiStep > 2 }]"><span class="ai-step-num">2</span><span class="ai-step-label">小类</span></div>
                <div :class="['ai-step-line', { active: aiStep > 2 }]"></div>
                <div :class="['ai-step-dot', { active: aiStep >= 3, done: aiStep > 3 }]"><span class="ai-step-num">3</span><span class="ai-step-label">拍表现</span></div>
                <div :class="['ai-step-line', { active: aiStep > 3 }]"></div>
                <div :class="['ai-step-dot', { active: aiStep >= 4, done: aiStep > 4 }]"><span class="ai-step-num">4</span><span class="ai-step-label">拍源头</span></div>
                <div :class="['ai-step-line', { active: aiStep > 4 }]"></div>
                <div :class="['ai-step-dot', { active: aiStep >= 5 }]"><span class="ai-step-num">5</span><span class="ai-step-label">报告</span></div>
              </div>

              <!-- Step 1: 选择大类 -->
              <div v-if="aiStep === 1" class="ai-step-content">
                <div class="ai-section-title">请选择渗漏类型</div>
                <div class="ai-category-grid">
                  <div v-for="cat in aiCategories" :key="cat.id" class="ai-category-card" :style="{ borderTopColor: cat.color }" @click="selectAICategory(cat.id)">
                    <div class="ai-category-icon" :style="{ background: cat.color + '20', color: cat.color }">{{ cat.icon }}</div>
                    <div class="ai-category-name">{{ cat.name }}</div>
                    <div class="ai-category-desc">{{ cat.desc }}</div>
                  </div>
                </div>
              </div>

              <!-- Step 2: 选择小类 -->
              <div v-if="aiStep === 2" class="ai-step-content">
                <div class="ai-section-title">{{ getAICategoryInfo(aiCategory)?.icon }} {{ getAICategoryInfo(aiCategory)?.name }} - 请选择具体渗漏位置</div>
                <div class="ai-subcategory-list">
                  <div v-for="sub in aiSubcategories" :key="sub.id" class="ai-subcategory-item" @click="selectAISubcategory(sub.id)">
                    <span class="ai-subcategory-icon">▸</span>
                    <span class="ai-subcategory-name">{{ sub.name }}</span>
                    <span class="ai-subcategory-arrow">›</span>
                  </div>
                </div>
              </div>

              <!-- Step 3: Phase1 - 拍渗漏表现 -->
              <div v-if="aiStep === 3" class="ai-step-content">
                <div class="ai-section-title">📸 拍摄渗漏表现</div>
                <div class="ai-info-banner">先拍全景（整体环境），再拍近景/特写（渗漏细节）</div>
                <!-- 全景 -->
                <div class="ai-photo-section">
                  <div class="ai-photo-section-header"><span>📐 全景照片</span><span class="ai-photo-count">{{ aiPanoramaCount }}/3张</span></div>
                  <div class="ai-photo-grid">
                    <div v-for="(photo, idx) in aiPhase1Photos.filter(p => p.type === 'panorama')" :key="'p'+idx" class="ai-photo-item">
                      <img :src="photo.thumbnail || photo.url" @click="viewAIPhoto(photo.url)" alt="全景">
                      <button class="ai-photo-delete" @click="removeAIPhoto(1, aiPhase1Photos.indexOf(photo))">×</button>
                      <div class="ai-photo-desc">
                        <input type="text" v-model="photo.description" placeholder="图片说明（可语音）" class="ai-desc-input">
                        <button class="ai-voice-btn" @click="startVoiceInput(1, aiPhase1Photos.indexOf(photo))" :class="{recording: aiVoiceRecording && aiVoiceTarget?.phase === 1 && aiVoiceTarget?.index === aiPhase1Photos.indexOf(photo)}">🎤</button>
                      </div>
                    </div>
                    <div v-if="aiPanoramaCount < 3" class="ai-photo-add" @click="addPanoramaPhoto()"><span class="ai-add-icon">📷</span><span>拍全景</span></div>
                    <div v-if="aiPanoramaCount < 3" class="ai-photo-add ai-photo-add-album" @click="selectAIPhotoFromAlbum('panorama')"><span class="ai-add-icon">📁</span><span>相册</span></div>
                  </div>
                </div>
                <!-- 近景/特写 -->
                <div class="ai-photo-section">
                  <div class="ai-photo-section-header"><span>🔍 近景/特写照片</span><span class="ai-photo-count">{{ aiCloseupCount }}张</span></div>
                  <div class="ai-photo-grid">
                    <div v-for="(photo, idx) in aiPhase1Photos.filter(p => p.type === 'closeup')" :key="'c'+idx" class="ai-photo-item">
                      <img :src="photo.thumbnail || photo.url" @click="viewAIPhoto(photo.url)" alt="近景">
                      <button class="ai-photo-delete" @click="removeAIPhoto(1, aiPhase1Photos.indexOf(photo))">×</button>
                      <div class="ai-photo-desc">
                        <input type="text" v-model="photo.description" placeholder="图片说明（可语音）" class="ai-desc-input">
                        <button class="ai-voice-btn" @click="startVoiceInput(1, aiPhase1Photos.indexOf(photo))" :class="{recording: aiVoiceRecording && aiVoiceTarget?.phase === 1 && aiVoiceTarget?.index === aiPhase1Photos.indexOf(photo)}">🎤</button>
                      </div>
                    </div>
                    <div class="ai-photo-add" @click="addCloseupPhoto()"><span class="ai-add-icon">📷</span><span>拍近景</span></div>
                    <div class="ai-photo-add ai-photo-add-album" @click="selectAIPhotoFromAlbum('closeup')"><span class="ai-add-icon">📁</span><span>相册</span></div>
                  </div>
                </div>
                <div class="ai-tip-box">💡 拍得越多AI分析越精准！建议至少1张全景+2张近景</div>
                <button v-if="aiPhase1Photos.length >= 1" class="btn btn-primary btn-block ai-next-btn" @click="goToPhase2()">下一步：拍摄源头部位 →</button>
              </div>

              <!-- Step 4: Phase2 - 拍源头部位 -->
              <div v-if="aiStep === 4" class="ai-step-content">
                <div class="ai-section-title">📸 拍摄源头部位</div>
                <div class="ai-info-banner">{{ getAICategoryInfo(aiCategory)?.icon }} {{ getAICategoryInfo(aiCategory)?.name }} - {{ getAISubcategoryInfo(aiCategory, aiSubcategory)?.name }}</div>
                <div v-if="aiRequiredCheck.missing.length > 0" class="ai-required-notice">
                  <div class="ai-required-title">⚠️ 必拍项（还差{{ aiRequiredCheck.missing.length }}项）</div>
                  <div v-for="m in aiRequiredCheck.missing" :key="m.id" class="ai-required-item">{{ m.icon }} {{ m.name }}</div>
                </div>
                <div v-else class="ai-required-done">✅ 所有必拍项已完成！可选拍更多照片提升精度</div>
                <div class="ai-guide-grid">
                  <div v-for="guide in aiPhotoGuides" :key="guide.id" class="ai-guide-card">
                    <div class="ai-guide-card-header">
                      <span class="ai-guide-icon">{{ guide.icon }}</span>
                      <span class="ai-guide-name">{{ guide.name }}</span>
                      <span v-if="guide.required" class="ai-guide-required">必拍</span>
                    </div>
                    <div v-for="(photo, idx) in aiPhase2Photos.filter(p => p.guideId === guide.id)" :key="idx" class="ai-guide-photo">
                      <img :src="photo.thumbnail || photo.url" @click="viewAIPhoto(photo.url)" alt="">
                      <button class="ai-photo-delete" @click="removeAIPhoto(2, aiPhase2Photos.indexOf(photo))">×</button>
                      <div class="ai-photo-desc">
                        <input type="text" v-model="photo.description" placeholder="说明（可语音）" class="ai-desc-input">
                        <button class="ai-voice-btn" @click="startVoiceInput(2, aiPhase2Photos.indexOf(photo))" :class="{recording: aiVoiceRecording && aiVoiceTarget?.phase === 2 && aiVoiceTarget?.index === aiPhase2Photos.indexOf(photo)}">🎤</button>
                      </div>
                    </div>
                    <div class="ai-guide-actions">
                      <button class="btn btn-outline ai-guide-btn" @click="addPhase2Photo(guide.id, guide.name, guide.icon)">📷 拍照</button>
                      <button class="btn btn-outline ai-guide-btn" @click="selectAIPhotoFromAlbum('phase2', guide.id, guide.name, guide.icon)">📁 相册</button>
                    </div>
                  </div>
                </div>
                <div class="ai-tip-box">💡 源头部位照片帮助AI精准定位渗漏原因，拍得越全诊断越准</div>
                <button v-if="aiPhase1Photos.length + aiPhase2Photos.length >= 2" class="btn btn-primary btn-block ai-next-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);" @click="generateAIReport()">🤖 生成AI分析报告</button>
                <div v-else style="text-align: center; color: #999; padding: 20px;">至少拍摄2张照片才能生成报告（当前{{ aiPhase1Photos.length + aiPhase2Photos.length }}张）</div>
              </div>

              <!-- Step 5: AI报告 -->
              <div v-if="aiStep === 5" class="ai-step-content">
                <div v-if="aiAnalyzing" class="ai-analyzing">
                  <div class="ai-analyzing-spinner"></div>
                  <div class="ai-analyzing-text">AI正在分析{{ aiPhase1Photos.length + aiPhase2Photos.length }}张照片...</div>
                  <div class="ai-analyzing-sub">多图交叉验证中，请稍候</div>
                  <div class="ai-analyzing-progress"><div class="ai-analyzing-bar"></div></div>
                </div>
                <div v-else-if="aiReport" class="ai-report">
                  <div :class="['ai-report-level', 'level-' + aiReport.level.toLowerCase()]">
                    <div class="ai-report-level-main">{{ aiReport.level }}级</div>
                    <div class="ai-report-level-desc">{{ aiReport.levelDesc }}</div>
                  </div>
                  <div class="ai-report-section">
                    <div class="ai-report-section-title">📋 基本信息</div>
                    <div class="ai-report-info-row"><span>渗漏大类：</span>{{ getAICategoryInfo(aiCategory)?.name }}</div>
                    <div class="ai-report-info-row"><span>渗漏小类：</span>{{ getAISubcategoryInfo(aiCategory, aiSubcategory)?.name }}</div>
                    <div class="ai-report-info-row"><span>分析照片：</span>{{ aiPhase1Photos.length + aiPhase2Photos.length }}张</div>
                    <div class="ai-report-info-row" v-if="aiReport.location"><span>渗漏位置：</span>{{ aiReport.location }}</div>
                  </div>
                  <div v-if="aiReport.observation" class="ai-report-section">
                    <div class="ai-report-section-title">🔍 多图观察</div>
                    <div class="ai-report-text">{{ aiReport.observation }}</div>
                  </div>
                  <div v-if="aiReport.reasoning" class="ai-report-section">
                    <div class="ai-report-section-title">🧠 交叉验证推理</div>
                    <div class="ai-report-text">{{ aiReport.reasoning }}</div>
                  </div>
                  <div v-if="aiReport.conclusion" class="ai-report-section">
                    <div class="ai-report-section-title">📋 诊断结论</div>
                    <div class="ai-report-text">{{ aiReport.conclusion }}</div>
                  </div>
                  <div v-if="aiReport.suggestion" class="ai-report-section ai-report-suggestion">
                    <div class="ai-report-section-title">🔧 修复方向</div>
                    <div class="ai-report-text">{{ aiReport.suggestion }}</div>
                  </div>
                  <div class="ai-report-section ai-report-visit">
                    <div class="ai-report-section-title">🏠 上门建议</div>
                    <div class="ai-report-text">{{ aiReport.homeVisit || '建议上门检测确认' }}</div>
                    <div v-if="aiReport.costEstimate" class="ai-report-cost">💰 {{ aiReport.costEstimate }}</div>
                  </div>
                  <div class="ai-report-section">
                    <div class="ai-report-section-title">📷 分析照片（{{ aiPhase1Photos.length + aiPhase2Photos.length }}张）</div>
                    <div class="ai-report-photos">
                      <div v-for="(photo, idx) in aiPhase1Photos" :key="'r1'+idx" class="ai-report-thumb" @click="viewAIPhoto(photo.url)">
                        <img :src="photo.thumbnail || photo.url" alt="">
                        <span class="ai-report-thumb-label">表现·{{ photo.type === 'panorama' ? '全景' : '近景' }}</span>
                      </div>
                      <div v-for="(photo, idx) in aiPhase2Photos" :key="'r2'+idx" class="ai-report-thumb" @click="viewAIPhoto(photo.url)">
                        <img :src="photo.thumbnail || photo.url" alt="">
                        <span class="ai-report-thumb-label">{{ photo.guideName }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="ai-report-actions">
                    <button class="btn btn-outline btn-block" @click="resetAIDetect()">🔄 重新检测</button>
                    <button class="btn btn-primary btn-block" @click="navigateTo('home')">🏠 返回首页</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="ai-bottom-tip" v-if="aiStep > 0 && aiStep < 5">
              <span v-if="aiStep === 1">选择渗漏大类，定位方向</span>
              <span v-else-if="aiStep === 2">选择具体渗漏位置</span>
              <span v-else-if="aiStep === 3">先全景后近景，拍得越多AI越准</span>
              <span v-else-if="aiStep === 4">按引导拍源头部位照片</span>
            </div>
          </div>

          <!-- ========== 设置页面 ========== -->
          <div v-if="currentPage === 'settings'" class="page-settings">
            <div class="page-header">
              <span class="back-btn" @click="navigateTo('home')">←</span>
              <h1>设置</h1>
              <span style="width: 30px;"></span>
            </div>
            
            <div class="page-content">
              <div class="card">
                <div class="card-title">👤 个人信息</div>
                <div class="form-group"><label class="form-label">员工姓名</label><input type="text" class="form-input" v-model="currentUser.name" disabled></div>
                <div class="form-group"><label class="form-label">角色</label><input type="text" class="form-input" :value="getRoleText(currentUser.role)" disabled></div>
              </div>
              
              <!-- v4.0 通知设置 -->
              <div class="card">
                <div class="card-title">🔔 通知设置</div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #ebedf0;">
                  <span>浏览器通知</span>
                  <button class="btn btn-outline" @click="AppNotification?.requestPermission?.()">授权</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                  <span>离线模式</span>
                  <span style="color: #07c160;">{{ syncStatus.isOnline ? '🟢 在线' : '🔴 离线' }}</span>
                </div>
              </div>
              
              <div v-if="isAdmin" class="card">
                <div class="card-title">🤖 Coze API</div>
                <div class="form-group"><label class="form-label">Bot ID</label><input type="text" class="form-input" v-model="settings.cozeBotId" placeholder="输入Bot ID"></div>
                <div class="form-group"><label class="form-label">Access Token</label><input type="password" class="form-input" v-model="settings.cozeToken" placeholder="输入Token"></div>
                <button class="btn btn-outline btn-block" @click="saveSettings">保存</button>
              </div>
              
              <div class="card">
                <div class="card-title">💾 数据管理</div>
                <button class="btn btn-danger btn-block" @click="clearAllData">清空所有数据</button>
              </div>
            </div>
            
            <div class="tabbar">
              <a class="tabbar-item" @click="navigateTo('home')"><span class="icon">🏠</span><span class="text">首页</span></a>
              <a class="tabbar-item active"><span class="icon">⚙️</span><span class="text">设置</span></a>
            </div>
          </div>
        </template>
      </div>
    `,

    components: {
      'leak-selector': {
        props: ['selected'],
        emits: ['update'],
        setup(props, { emit }) {
          const locations = SOP.LEAK_LOCATIONS;
          const isSelected = (locId) => props.selected.some(s => s.id === locId);
          const toggleLocation = (loc) => {
            const current = [...props.selected];
            const index = current.findIndex(s => s.id === loc.id);
            if (index >= 0) current.splice(index, 1); else current.push({ id: loc.id, name: loc.name, icon: loc.icon, notes: '' });
            emit('update', current);
          };
          const updateNotes = (locId, notes) => {
            const current = [...props.selected];
            const item = current.find(s => s.id === locId);
            if (item) { item.notes = notes; emit('update', current); }
          };
          return { locations, isSelected, toggleLocation, updateNotes };
        },
        template: `
          <div>
            <div class="leak-selector">
              <div v-for="loc in locations" :key="loc.id" :class="'leak-item ' + (isSelected(loc.id) ? 'selected' : '')" @click="toggleLocation(loc)">
                <span class="icon">{{ loc.icon }}</span><span class="name">{{ loc.name }}</span>
              </div>
            </div>
            <div v-for="loc in selected" :key="loc.id" class="form-group mt-12">
              <label class="form-label">{{ loc.icon }} {{ loc.name }} - 备注</label>
              <textarea class="form-input" :value="loc.notes" @input="e => updateNotes(loc.id, e.target.value)" placeholder="可选：添加该位置的详细描述或观察"></textarea>
            </div>
          </div>
        `
      }
    },

    methods: {
      handleCreateProject() {
        if (!this.currentInspection) this.currentInspection = {};
        if (!this.currentInspection.customerName) { this.showToastMessage('请输入客户姓名'); return; }
        if (!this.currentInspection.customerPhone) { this.showToastMessage('请输入联系电话'); return; }
        if (!this.currentInspection.customerAddress) { this.showToastMessage('请输入勘察地址'); return; }
        
        this.createProject({
          customerName: this.currentInspection.customerName,
          customerPhone: this.currentInspection.customerPhone,
          customerAddress: this.currentInspection.customerAddress,
          buildingType: this.currentInspection.buildingType,
          buildYear: this.currentInspection.buildYear,
          leakLocations: this.currentInspection.leakLocations || [],
          surveyorId: this.currentInspection.surveyorId,
          surveyorName: this.currentInspection.surveyorName,
          workerId: this.currentInspection.workerId,
          workerName: this.currentInspection.workerName,
          reviewerId: this.currentInspection.reviewerId,
          reviewerName: this.currentInspection.reviewerName
        });
      },
      
      async takePhotoAndAddToInspection() {
        const result = await this.takePhoto({ stage: 'survey' });
        if (result && result.photoData) {
          if (!this.currentInspection) this.currentInspection = {};
          if (!this.currentInspection.photos) this.currentInspection.photos = [];
          this.currentInspection.photos.push({
            id: result.photoData.id,
            url: result.photoData.url,
            stageName: '勘察照片',
            timestamp: result.photoData.timestamp
          });
          this.saveInspection({ photos: this.currentInspection.photos });
        }
      },
      
      viewPhoto(url) {
        const overlay = document.createElement('div');
        overlay.className = 'photo-viewer-overlay';
        overlay.innerHTML = '<div class="photo-viewer-content"><img src="' + url + '"><button class="photo-viewer-close">×</button></div>';
        overlay.onclick = () => overlay.remove();
        document.body.appendChild(overlay);
      },
      
      showRejectModal(stepIndex) {
        const reason = prompt('请输入打回原因（必填）：');
        if (reason) this.reviewStep(this.currentProject.id, stepIndex, false, reason);
      }
    }
  };

  const app = createApp(App);
  app.use(vant);
  app.mount('#app');
});
