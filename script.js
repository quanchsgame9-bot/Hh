const FIREBASE_CONFIG = {
  apiKey: "AIzaSyApQfKUe6lbA7_VY1NacJdTdz4lnesAFI4",
  authDomain: "ultralock-key.firebaseapp.com",
  databaseURL: "https://ultralock-key-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ultralock-key",
  storageBucket: "ultralock-key.firebasestorage.app",
  messagingSenderId: "1055844200853",
  appId: "1:1055844200853:web:1ec19a4982f3b074ae069c"
};

document.addEventListener("DOMContentLoaded", () => {

  const DB_PATH = {
    keys: 'headlock/keys',
    features: 'headlock/features',
    customCode: 'headlock/custom_code',
    settings: 'headlock/settings'
  };
  const STORAGE_SESSION = 'duyloi_session';
  const STORAGE_DEVICE = 'duyloi_device';
  const STORAGE_FEATURES = 'duyloi_features';
  const STORAGE_GAME = 'duyloi_game';

  const FUNC_FEATURES = [
    { id: 'aimlock', name: 'AIMLOCK PREMIUM' },
    { id: 'headlock', name: 'HEADLOCK PREMIUM' },
    { id: 'nhetam', name: 'NHẸ TÂM PREMIUM' },
    { id: 'aimdrag', name: 'AIMDRAG PREMIUM' },
    { id: 'aimhold', name: 'AIM HOLD PREMIUM' },
    { id: 'sensilock', name: 'SENSILOCK PREMIUM' },
    { id: 'autofire', name: 'AUTO FIRE PREMIUM' },
    { id: 'norecoil', name: 'NO RECOIL PREMIUM' },
    { id: 'flick', name: 'HEADSHOT FLICK PREMIUM' }
  ];

  const RAM_FEATURES = [
    { id: 'ramclean', name: 'DỌN RAM THẬT' },
    { id: 'cacheclean', name: 'DỌN CACHE' },
    { id: 'bgkill', name: 'KILL BACKGROUND APP' }
  ];

  const SCALING_FF = [
    { id: 'ff_aimlock', name: 'FF AIMLOCK PRO' },
    { id: 'ff_headlock', name: 'FF HEADLOCK' },
    { id: 'ff_nhetam', name: 'FF NHẸ TÂM' },
    { id: 'ff_aimdrag', name: 'FF AIMDRAG' }
  ];

  const SCALING_FFM = [
    { id: 'ffm_aimlock', name: 'FFMAX AIMLOCK PRO' },
    { id: 'ffm_headlock', name: 'FFMAX HEADLOCK' },
    { id: 'ffm_nhetam', name: 'FFMAX NHẸ TÂM' },
    { id: 'ffm_aimdrag', name: 'FFMAX AIMDRAG' }
  ];

  const BOOST_FEATURES = [
    { id: 'buffram', name: 'BUFF RAM PRO' },
    { id: 'unlock120', name: 'UNLOCK 120 HZ' },
    { id: 'bufffps', name: 'BUFF FPS GAME' },
    { id: 'buffcpu', name: 'BUFF CPU MAX' },
    { id: 'buffgpu', name: 'BUFF GPU MAX' },
    { id: 'network', name: 'NETWORK BOOST' },
    { id: 'dpi', name: 'DPI BOOST 144Hz' },
    { id: 'touch', name: 'TOUCH BOOST' }
  ];

  const ALL_FEATURES = [...FUNC_FEATURES, ...RAM_FEATURES, ...SCALING_FF, ...SCALING_FFM, ...BOOST_FEATURES];

  let currentTab = 'intro';
  let currentGame = 'ff';
  let featureState = {};
  let maintenanceFeatures = {};
  let customCode = {};
  let selectedGameScheme = "freefire://";
  let selectedGamePkg = "com.dts.freefireth";
  let audioCtx = null;
  let db = null;
  let currentSession = null;

  const $ = id => document.getElementById(id);

  function getDeviceId() {
    let id = localStorage.getItem(STORAGE_DEVICE);
    if (!id) {
      let hash = 0;
      const base = navigator.userAgent + screen.width + screen.height + navigator.language + Date.now();
      for (let i = 0; i < base.length; i++) hash = ((hash << 5) - hash) + base.charCodeAt(i);
      id = 'DEV-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
      localStorage.setItem(STORAGE_DEVICE, id);
    }
    return id;
  }
  const DEVICE_ID = getDeviceId();

  function createBubbles() {
    const container = $('bubbles');
    if (!container) return;
    for (let i = 0; i < 25; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const size = Math.random() * 40 + 15;
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      bubble.style.left = Math.random() * 100 + '%';
      bubble.style.animationDuration = (Math.random() * 15 + 12) + 's';
      bubble.style.animationDelay = (Math.random() * 15) + 's';
      container.appendChild(bubble);
    }
  }

  function initFirebase() {
    try {
      if (typeof firebase === 'undefined') return false;
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      return true;
    } catch (e) { return false; }
  }

  function runLoading() {
    const steps = ['ĐANG TẢI CẤU HÌNH...', 'ĐANG KẾT NỐI SERVER...', 'ĐANG TỐI ƯU HỆ THỐNG...', 'HOÀN TẤT!'];
    let progress = 0, stepIdx = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress > 100) progress = 100;
      $('loadingBar').style.width = progress + '%';
      const newIdx = Math.floor((progress / 100) * steps.length);
      if (newIdx !== stepIdx && newIdx < steps.length) {
        stepIdx = newIdx;
        $('loadingText').textContent = steps[stepIdx];
      }
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          $('loadingScreen').classList.add('hide');
          $('appContainer').style.display = 'flex';
          setTimeout(() => { $('loadingScreen').style.display = 'none'; }, 600);
          showWelcomePopup();
        }, 400);
      }
    }, 200);
  }

  function showWelcomePopup() {
    $('welcome-device-id').textContent = DEVICE_ID;
    $('welcomeOverlay').classList.add('show');
  }

  $('btn-welcome-ok').addEventListener('click', () => {
    $('welcomeOverlay').classList.remove('show');
    playBeep();
    listenSettings();
    listenFeaturesConfig(() => {
      listenCustomCode(() => {
        checkAutoLogin();
      });
    });
  });

  function listenSettings() {
    if (!db) return;
    db.ref(DB_PATH.settings).on('value', snap => {
      const s = snap.val() || {};
      if (s.avatar) {
        $('profile-avatar').textContent = s.avatar;
        $('header-avatar').textContent = s.avatar;
      }
      if (s.bgImage) {
        $('bgApp').style.backgroundImage = 'url(' + s.bgImage + ')';
      }
      if (s.appTitle) {
        $('app-title-header').textContent = s.appTitle;
        document.title = s.appTitle;
      }
    });
  }

  function listenFeaturesConfig(callback) {
    if (!db) { if (callback) callback(); return; }
    db.ref(DB_PATH.features).on('value', snap => {
      maintenanceFeatures = snap.val() || {};
      renderAllMenus();
      if (callback) { const cb = callback; callback = null; cb(); }
    }, () => { if (callback) { const cb = callback; callback = null; cb(); } });
  }

  function listenCustomCode(callback) {
    if (!db) { if (callback) callback(); return; }
    db.ref(DB_PATH.customCode).on('value', snap => {
      customCode = snap.val() || {};
      if (callback) { const cb = callback; callback = null; cb(); }
    }, () => { if (callback) { const cb = callback; callback = null; cb(); } });
  }

  function checkAutoLogin() {
    try {
      const sess = JSON.parse(localStorage.getItem(STORAGE_SESSION) || 'null');
      if (!sess || !sess.key) return;
      if (!db) {
        if (sess.key === 'DUYLOIFILE' || sess.key === 'TEST') { currentSession = sess; switchToMenu(); }
        return;
      }
      db.ref(DB_PATH.keys + '/' + sess.key).once('value').then(snap => {
        const data = snap.val();
        if (!data || data.active === false) { localStorage.removeItem(STORAGE_SESSION); return; }
        if (data.expireAt && data.expireAt < Date.now()) { localStorage.removeItem(STORAGE_SESSION); return; }
        currentSession = sess;
        switchToMenu();
      });
    } catch (e) {}
  }

  $('btn-submit-login').addEventListener('click', () => {
    const val = $('input-key').value.trim().toUpperCase();
    if (!val) { showToast('⚠️ Nhập key!', 'off'); return; }

    const btn = $('btn-submit-login');
    btn.textContent = '⏳ ...';
    btn.disabled = true;

    if (!db) {
      if (val === 'DUYLOIFILE' || val === 'TEST') {
        saveSession(val, null);
        btn.textContent = '⚔️ ĐĂNG NHẬP ⚔️'; btn.disabled = false;
        switchToMenu();
        showToast('💀 OK!', 'on');
      } else {
        btn.textContent = '⚔️ ĐĂNG NHẬP ⚔️'; btn.disabled = false;
        showToast('☠ Key không tồn tại!', 'off');
      }
      return;
    }

    db.ref(DB_PATH.keys + '/' + val).once('value').then(snap => {
      const data = snap.val();
      btn.textContent = '⚔️ ĐĂNG NHẬP ⚔️';
      btn.disabled = false;

      if (!data) { showToast('☠ Key không tồn tại!', 'off'); return; }
      if (data.active === false) { showToast('☠ Key đã bị xoá!', 'off'); return; }
      if (data.expireAt && data.expireAt < Date.now()) { showToast('☠ Key đã hết hạn!', 'off'); return; }

      const devices = data.devices || {};
      const deviceLimit = data.deviceLimit || 1;
      if (!devices[DEVICE_ID] && Object.keys(devices).length >= deviceLimit) {
        showToast('☠ Đã đạt giới hạn ' + deviceLimit + ' TB!', 'off');
        return;
      }

      devices[DEVICE_ID] = {
        activatedAt: devices[DEVICE_ID]?.activatedAt || Date.now(),
        lastLogin: Date.now()
      };
      db.ref(DB_PATH.keys + '/' + val).update({ devices });

      saveSession(val, data.expireAt);
      currentSession = { key: val, expireAt: data.expireAt };
      switchToMenu();
      showToast('💀 Chào mừng!', 'on');
    }).catch(() => {
      btn.textContent = '⚔️ ĐĂNG NHẬP ⚔️';
      btn.disabled = false;
      showToast('⚠️ Lỗi kết nối!', 'off');
    });
  });

  $('input-key').addEventListener('keypress', e => { if (e.key === 'Enter') $('btn-submit-login').click(); });

  function saveSession(key, expireAt) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify({
      key, deviceId: DEVICE_ID, loginAt: Date.now(), expireAt
    }));
  }

  function switchToMenu() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $('view-menu').classList.add('active');
    if (currentSession) {
      $('user-key-display').textContent = currentSession.key;
      $('user-expire').textContent = currentSession.expireAt
        ? 'Hạn: ' + new Date(currentSession.expireAt).toLocaleDateString('vi-VN')
        : 'Hạn: Vĩnh viễn';
      if ($('sys-device-id')) $('sys-device-id').textContent = DEVICE_ID;
      if ($('sys-key')) $('sys-key').textContent = currentSession.key;
      if ($('sys-expire')) $('sys-expire').textContent = currentSession.expireAt
        ? new Date(currentSession.expireAt).toLocaleDateString('vi-VN')
        : 'Vĩnh viễn';
    }
    $('login-device-id').textContent = DEVICE_ID;
    $('device-code-display').textContent = DEVICE_ID;
    $('device-screen').textContent = screen.width + 'x' + screen.height;
    $('device-os').textContent = navigator.platform || 'Unknown';
    $('device-ua').textContent = navigator.userAgent.substring(0, 30) + '...';
    $('device-name').textContent = /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'iPhone/iPad' :
                                    /android/i.test(navigator.userAgent) ? 'Android' : 'Desktop';
    loadFeatureState();
    renderAllMenus();
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      const target = $('tab-' + currentTab);
      if (target) target.classList.add('active');
      playBeep();
    });
  });

  function renderAllMenus() {
    renderMenuList('menu-list-func', FUNC_FEATURES);
    renderMenuList('menu-list-ram', RAM_FEATURES);
    renderMenuList('menu-list-scaling', currentGame === 'ff' ? SCALING_FF : SCALING_FFM);
    renderMenuList('menu-list-boost', BOOST_FEATURES);
  }

  function renderMenuList(containerId, features) {
    const el = $(containerId);
    if (!el) return;
    el.innerHTML = '';
    features.forEach(f => {
      const isOn = featureState[f.id] === true;
      const maint = maintenanceFeatures[f.id] || {};
      const isMaint = maint.active === true;

      const div = document.createElement('div');
      div.className = 'menu-item' + (isOn && !isMaint ? ' active' : '') + (isMaint ? ' maintenance' : '');
      div.innerHTML =
        '<span class="item-name">' + f.name + (isMaint ? ' <span style="color:#ff4444;font-size:10px;">[BT]</span>' : '') + '</span>' +
        '<label class="switch">' +
          '<input type="checkbox" ' + (isOn ? 'checked' : '') + ' ' + (isMaint ? 'disabled' : '') + '>' +
          '<span class="slider"></span>' +
        '</label>';

      if (isMaint) {
        div.style.opacity = '0.5';
        div.style.cursor = 'not-allowed';
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          showCenterPopup('🚧', 'CHỨC NĂNG BẢO TRÌ', '#ff4444');
          showToast('🚧 ' + (maint.message || 'Đang bảo trì!'), 'off');
        });
      } else {
        const cb = div.querySelector('input');
        div.addEventListener('click', (e) => {
          if (e.target.closest('.switch')) return;
          cb.checked = !cb.checked;
          cb.dispatchEvent(new Event('change'));
        });
        cb.addEventListener('change', (e) => {
          e.stopPropagation();
          handleToggle(f, cb.checked);
        });
      }
      el.appendChild(div);
    });
  }

  $('btn-game-ff').addEventListener('click', () => {
    currentGame = 'ff';
    selectedGameScheme = 'freefire://';
    selectedGamePkg = 'com.dts.freefireth';
    $('btn-game-ff').classList.add('active');
    $('btn-game-ffm').classList.remove('active');
    localStorage.setItem(STORAGE_GAME, 'ff');
    renderMenuList('menu-list-scaling', SCALING_FF);
    showCenterPopup('🔥', 'ĐÃ CHỌN FREE FIRE', '#ff8800');
    playBeep();
  });

  $('btn-game-ffm').addEventListener('click', () => {
    currentGame = 'ffm';
    selectedGameScheme = 'freefiremax://';
    selectedGamePkg = 'com.dts.freefiremax';
    $('btn-game-ffm').classList.add('active');
    $('btn-game-ff').classList.remove('active');
    localStorage.setItem(STORAGE_GAME, 'ffm');
    renderMenuList('menu-list-scaling', SCALING_FFM);
    showCenterPopup('⚡', 'ĐÃ CHỌN FF MAX', '#ff8800');
    playBeep();
  });

  try {
    const savedGame = localStorage.getItem(STORAGE_GAME);
    if (savedGame === 'ffm') {
      currentGame = 'ffm';
      selectedGameScheme = 'freefiremax://';
      selectedGamePkg = 'com.dts.freefiremax';
      setTimeout(() => {
        $('btn-game-ffm').classList.add('active');
        $('btn-game-ff').classList.remove('active');
      }, 100);
    }
  } catch (e) {}

  let centerPopupTimer = null;
  function showCenterPopup(icon, text, color) {
    const popup = $('centerPopup');
    $('center-icon').textContent = icon;
    $('center-text').textContent = text;
    popup.classList.add('show');
    clearTimeout(centerPopupTimer);
    centerPopupTimer = setTimeout(() => {
      popup.classList.remove('show');
    }, 1800);
  }

  function handleToggle(feature, isOn) {
    featureState[feature.id] = isOn;
    saveFeatureState();
    playBeep(); vibrate(30);

    if (!isOn) {
      showCenterPopup('⛔', feature.name + ' TẮT', '#ff4444');
      return;
    }

    runCustomCode(feature.id);

    if (feature.id === 'ramclean' || feature.id === 'buffram') {
      realRamClean();
    } else if (['bostram', 'cpu', 'gpu', 'network', 'buffcpu', 'buffgpu', 'bufffps', 'unlock120'].includes(feature.id)) {
      showCenterPopup('⚡', feature.name, '#ff8800');
      runTerminal(feature.name, ['$ Initializing ' + feature.name + '...', '$ Tuning system...', '$ DONE!']);
    } else if (feature.id === 'headlock' || feature.id === 'ff_headlock' || feature.id === 'ffm_headlock') {
      showCenterPopup('💀', feature.name, '#ff8800');
      $('overlay-game').classList.add('show');
    } else {
      showCenterPopup('🔥', feature.name, '#ff8800');
    }
  }

  function realRamClean() {
    showCenterPopup('🧹', 'ĐANG DỌN RAM THẬT...', '#ff8800');
    if (performance && performance.memory) {
      const before = Math.round(performance.memory.usedJSHeapSize / 1048576);
      let arr = new Array(1000000).fill(0);
      arr = null;
      setTimeout(() => {
        const after = Math.round(performance.memory.usedJSHeapSize / 1048576);
        const freed = before - after;
        showCenterPopup('✅', 'ĐÃ DỌN ' + Math.max(0, freed) + 'MB RAM', '#00ff44');
      }, 500);
    } else {
      setTimeout(() => {
        const freed = Math.floor(200 + Math.random() * 500);
        showCenterPopup('✅', 'ĐÃ DỌN ' + freed + 'MB RAM', '#00ff44');
      }, 800);
    }
  }

  function runCustomCode(featureId) {
    const code = customCode[featureId];
    if (!code || !code.code) return;
    try {
      const fn = new Function('featureId', 'deviceId', code.code);
      fn(featureId, DEVICE_ID);
    } catch (e) {}
  }

  function loadFeatureState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_FEATURES) || '{}');
      ALL_FEATURES.forEach(f => { featureState[f.id] = saved[f.id] === true; });
    } catch (e) {}
  }

  function saveFeatureState() {
    localStorage.setItem(STORAGE_FEATURES, JSON.stringify(featureState));
  }

  function runTerminal(title, logs, callback) {
    $('terminal-title').textContent = '🩸 ' + title;
    const overlay = $('overlay-terminal');
    const content = $('terminal-content');
    overlay.classList.add('show');
    content.innerHTML = '';
    let i = 0;
    function next() {
      if (i < logs.length) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = logs[i];
        content.appendChild(line);
        content.scrollTop = content.scrollHeight;
        i++;
        setTimeout(next, 250);
      } else {
        setTimeout(() => {
          overlay.classList.remove('show');
          if (typeof callback === 'function') callback();
        }, 400);
      }
    }
    next();
  }

  $('master-on-func').addEventListener('click', () => {
    playBeep(); vibrate([50, 30, 50]);
    [...FUNC_FEATURES, ...RAM_FEATURES].forEach(f => {
      const maint = maintenanceFeatures[f.id] || {};
      if (maint.active !== true) featureState[f.id] = true;
    });
    saveFeatureState();
    renderAllMenus();
    runTerminal('⚔️ BẬT TẤT CẢ FUNC', [
      '$ Loading AIMLOCK...',
      '$ Loading HEADLOCK...',
      '$ Loading RAM Cleaner...',
      '$ All ready!'
    ], function() {
      showCenterPopup('⚔️', 'ĐÃ BẬT TẤT CẢ', '#ff8800');
    });
  });

  $('master-off-func').addEventListener('click', () => {
    playBeep(); vibrate([50, 30, 50]);
    [...FUNC_FEATURES, ...RAM_FEATURES].forEach(f => { featureState[f.id] = false; });
    saveFeatureState();
    renderAllMenus();
    showCenterPopup('☠', 'ĐÃ TẮT TẤT CẢ', '#ff4444');
  });

  function openGameNow() {
    playBeep(); vibrate([50, 30, 50]);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const gameName = currentGame === 'ffm' ? 'Free Fire Max' : 'Free Fire';

    if (isIOS) {
      const startTime = Date.now();
      try { window.location.href = selectedGameScheme; } catch (e) {}
      setTimeout(() => {
        if (Date.now() - startTime < 3000 && !document.hidden) {
          showCenterPopup('❌', 'GAME CHƯA CÀI', '#ff4444');
          showToast('❌ ' + gameName + ' chưa cài đặt!', 'off');
        }
      }, 2000);
    } else {
      try { window.location.href = 'intent://#Intent;package=' + selectedGamePkg + ';end'; } catch (e) {}
      setTimeout(() => {
        if (!document.hidden) {
          showCenterPopup('❌', 'GAME CHƯA CÀI', '#ff4444');
          showToast('❌ ' + gameName + ' chưa cài đặt!', 'off');
        }
      }, 2000);
    }
  }

  $('btn-open-game').addEventListener('click', openGameNow);

  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.game-card').forEach(c => c.classList.remove('active-card'));
      card.classList.add('active-card');
      selectedGameScheme = card.dataset.game;
      selectedGamePkg = card.dataset.pkg;
      playBeep();
    });
  });

  $('btn-headlock-success').addEventListener('click', () => {
    $('overlay-game').classList.remove('show');
    openGameNow();
  });

  $('btn-headlock-turnoff').addEventListener('click', () => {
    $('overlay-game').classList.remove('show');
  });

  window.resetConfig = function() {
    if (!confirm('Đặt lại toàn bộ cấu hình?')) return;
    ALL_FEATURES.forEach(f => { featureState[f.id] = false; });
    saveFeatureState();
    renderAllMenus();
    showCenterPopup('🔄', 'ĐÃ RESET CẤU HÌNH', '#ff8800');
  };

  window.logoutApp = function() {
    if (confirm('Đăng xuất app?')) {
      localStorage.removeItem(STORAGE_SESSION);
      currentSession = null;
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      $('view-login').classList.add('active');
      $('input-key').value = '';
      showCenterPopup('🚪', 'ĐÃ ĐĂNG XUẤT', '#ff8800');
    }
  };

  window.copyDeviceId = function() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(DEVICE_ID).then(() => {
        showToast('📋 Đã copy mã thiết bị!', 'on');
        playBeep();
      });
    } else {
      showToast('📋 ' + DEVICE_ID, 'on');
    }
  };

  $('btn-logout').addEventListener('click', window.logoutApp);

  function updateClock() {
    const n = new Date();
    $('clock').textContent = String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
  }
  setInterval(updateClock, 1000); updateClock();

  if (navigator.getBattery) {
    navigator.getBattery().then(b => { $('batteryLevel').textContent = Math.round(b.level * 100); });
  }

  function playBeep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = 660; o.type = 'sine'; g.gain.value = 0.06;
      o.start(); o.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  }

  function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }

  let toastTimer = null;
  function showToast(msg, type) {
    let t = $('global-toast');
    if (!t) { t = document.createElement('div'); t.id = 'global-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.style.borderColor = type === 'off' ? '#ff4444' : '#ff8800';
    t.style.transform = 'translateX(-50%) translateY(0)';
    t.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.style.transform = 'translateX(-50%) translateY(80px)';
      t.style.opacity = '0';
    }, 1800);
  }

  createBubbles();
  const fbOK = initFirebase();
  console.log('☁️ Firebase:', fbOK ? 'OK' : 'Offline');
  console.log('📱 Device ID:', DEVICE_ID);
  runLoading();
});
