document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const themeButton = document.getElementById('themeBtn');
    const contrastButton = document.getElementById('contrastBtn');
    const fontIncreaseButton = document.getElementById('fontIncrease');
    const fontDecreaseButton = document.getElementById('fontDecrease');
    const menuButton = document.querySelector('.menu-toggle');
    const headerMenu = document.getElementById('header-menu');

    let savedTheme;
    let savedContrast;
    let savedFontScale;
    try {
        savedTheme = localStorage.getItem('theme-preference');
        savedContrast = localStorage.getItem('contrast-preference');
        savedFontScale = Number(localStorage.getItem('font-scale'));
    } catch {
        savedTheme = null;
        savedContrast = null;
        savedFontScale = Number(root.style.getPropertyValue('--font-scale'));
    }
    let isDark = savedTheme ? savedTheme === 'dark' : root.classList.contains('dark');
    let isHighContrast = savedContrast ? savedContrast === 'high' : root.classList.contains('high-contrast');
    let fontScale = Number.isFinite(savedFontScale) && savedFontScale >= 0.9 && savedFontScale <= 1.4
        ? savedFontScale
        : 1;

    function storePreference(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            return;
        }
    }

    function syncThemeControls() {
        if (themeButton) {
            themeButton.setAttribute('aria-pressed', String(isDark));
            themeButton.textContent = isDark ? 'Tema claro' : 'Tema escuro';
            themeButton.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
        }
        contrastButton?.setAttribute('aria-pressed', String(isHighContrast));
        document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
            meta.content = isHighContrast ? '#000000' : isDark ? '#171717' : '#fff9ef';
        });
    }

    function applyTheme(isDark) {
        root.classList.toggle('dark', isDark);
        storePreference('theme-preference', isDark ? 'dark' : 'light');
        syncThemeControls();
    }

    function applyContrast(isHighContrast) {
        root.classList.toggle('high-contrast', isHighContrast);
        storePreference('contrast-preference', isHighContrast ? 'high' : 'normal');
        syncThemeControls();
    }

    function applyFontScale() {
        root.style.setProperty('--font-scale', String(fontScale));
        storePreference('font-scale', String(fontScale));
    }

    root.classList.toggle('dark', isDark);
    root.classList.toggle('high-contrast', isHighContrast);
    syncThemeControls();
    applyFontScale();

    themeButton?.addEventListener('click', () => {
        isDark = !root.classList.contains('dark');
        applyTheme(isDark);
    });

    contrastButton?.addEventListener('click', () => {
        isHighContrast = !root.classList.contains('high-contrast');
        applyContrast(isHighContrast);
    });

    fontIncreaseButton?.addEventListener('click', () => {
        fontScale = Math.min(1.4, Math.round((fontScale + 0.1) * 10) / 10);
        applyFontScale();
    });

    function closeMobileMenu({ restoreFocus = false } = {}) {
        if (!menuButton || !headerMenu) {
            return;
        }
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Abrir menu');
        headerMenu.classList.remove('is-open');
        if (restoreFocus) {
            menuButton.focus();
        }
    }

    menuButton?.addEventListener('click', () => {
        const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', String(!isExpanded));
        menuButton.setAttribute('aria-label', isExpanded ? 'Abrir menu' : 'Fechar menu');
        headerMenu?.classList.toggle('is-open', !isExpanded);
    });
    headerMenu?.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => closeMobileMenu());
    });
    document.addEventListener('click', (event) => {
        if (menuButton?.getAttribute('aria-expanded') === 'true'
            && !headerMenu?.contains(event.target)
            && !menuButton.contains(event.target)) {
            closeMobileMenu();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
            closeMobileMenu({ restoreFocus: true });
        }
    });
    const desktopMenuQuery = window.matchMedia('(min-width: 769px)');
    if (desktopMenuQuery.addEventListener) {
        desktopMenuQuery.addEventListener('change', () => closeMobileMenu());
    } else {
        desktopMenuQuery.addListener(() => closeMobileMenu());
    }

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || event.defaultPrevented || event.button !== 0
            || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
            || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
        if (!target) {
            return;
        }

        event.preventDefault();
        if (window.location.hash !== link.hash) {
            window.history.pushState(null, '', link.hash);
        }
        target.scrollIntoView({ behavior: 'smooth' });
    });

    fontDecreaseButton?.addEventListener('click', () => {
        fontScale = Math.max(0.9, Math.round((fontScale - 0.1) * 10) / 10);
        applyFontScale();
    });

    const videoTrigger = document.querySelector('.gallery-video-trigger[data-video-src]');
    const videoDialog = document.querySelector('.gallery-video-dialog');
    const videoDialogContent = videoDialog?.querySelector('.gallery-video-dialog__content');
    const videoCloseButton = videoDialog?.querySelector('.gallery-video-close');
    const videoError = videoDialog?.querySelector('.gallery-video-error');
    let closeVideoTimer;
    let galleryVideoOpener;

    function closeVideoDialog() {
        if (!videoDialog?.open || videoDialog.classList.contains('is-closing')) {
            return;
        }

        videoDialog.classList.remove('is-open');
        videoDialog.classList.add('is-closing');
        videoDialog.querySelector('video')?.pause();
        closeVideoTimer = window.setTimeout(() => videoDialog.close(), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 560);
    }

    videoTrigger?.addEventListener('click', () => {
        if (!videoDialog || !videoDialogContent || !videoTrigger.dataset.videoSrc) {
            return;
        }

        galleryVideoOpener = document.activeElement;
        const video = document.createElement('video');
        video.className = 'gallery-video-player';
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = 'none';
        video.src = videoTrigger.dataset.videoSrc;
        video.setAttribute('aria-label', 'Vídeo do Projeto Universos');
        video.addEventListener('error', () => {
            if (videoError) {
                videoError.textContent = 'Não foi possível carregar o vídeo. Tente novamente.';
                videoError.hidden = false;
            }
        });

        if (videoError) {
            videoError.hidden = true;
            videoError.textContent = '';
        }
        videoDialogContent.replaceChildren(video);
        videoDialog.showModal();
        requestAnimationFrame(() => {
            videoDialog.classList.add('is-open');
            video.classList.add('is-open');
        });
        videoCloseButton?.focus({ preventScroll: true });

        video.play().catch(() => {
            if (videoError) {
                videoError.textContent = 'O vídeo não iniciou automaticamente. Use os controles para reproduzir.';
                videoError.hidden = false;
            }
        });
    });

    videoCloseButton?.addEventListener('click', closeVideoDialog);
    videoDialog?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeVideoDialog();
        }
    });
    videoDialog?.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeVideoDialog();
    });
    videoDialog?.addEventListener('click', (event) => {
        if (event.target === videoDialog) {
            closeVideoDialog();
        }
    });
    videoDialog?.addEventListener('close', () => {
        window.clearTimeout(closeVideoTimer);
        videoDialog.classList.remove('is-open', 'is-closing');
        const video = videoDialog.querySelector('video');
        video?.pause();
        video?.removeAttribute('src');
        video?.load();
        videoDialogContent?.replaceChildren();
        if (videoError) {
            videoError.hidden = true;
            videoError.textContent = '';
        }
        galleryVideoOpener?.focus({ preventScroll: true });
    });

    const filmVideoTrigger = document.querySelector('.film-video-trigger[data-video-src]');
    const filmVideoDialog = document.querySelector('.film-video-dialog');
    const filmVideoContent = filmVideoDialog?.querySelector('.film-video-content');
    const filmVideoCloseButton = filmVideoDialog?.querySelector('.film-video-close');
    const filmVideo = filmVideoDialog?.querySelector('.film-video-player');
    const filmPlayerToggle = filmVideoDialog?.querySelector('.film-player-toggle');
    const filmPlayerSeek = filmVideoDialog?.querySelector('.film-player-seek');
    const filmPlayerCurrent = filmVideoDialog?.querySelector('.film-player-current');
    const filmPlayerDuration = filmVideoDialog?.querySelector('.film-player-duration');
    const filmPlayerMute = filmVideoDialog?.querySelector('.film-player-mute');
    const filmPlayerVolume = filmVideoDialog?.querySelector('.film-player-volume');
    const filmPlayerQuality = filmVideoDialog?.querySelector('.film-player-quality');
    const filmPlayerFullscreen = filmVideoDialog?.querySelector('.film-player-fullscreen');
    const filmPlayerStatus = filmVideoDialog?.querySelector('.film-player-status');
    const filmVideoSources = {
        '1080p': './images/video-curta.mp4',
        '720p': './images/video-curta-720p.mp4',
        '480p': './images/video-curta-480p.mp4'
    };
    let closeFilmVideoTimer;

    if (filmPlayerVolume && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)) {
        filmPlayerVolume.hidden = true;
    }

    function preferredFilmQuality() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType || '')) {
            return '480p';
        }
        return window.innerWidth <= 768 ? '720p' : '1080p';
    }

    function formatVideoTime(seconds) {
        const safeSeconds = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
        const minutes = Math.floor(safeSeconds / 60);
        const remainingSeconds = String(safeSeconds % 60).padStart(2, '0');
        return `${minutes}:${remainingSeconds}`;
    }

    function setFilmPlayerStatus(message) {
        if (filmPlayerStatus) {
            filmPlayerStatus.textContent = message;
            filmPlayerStatus.hidden = !message;
        }
    }

    function updateFilmPlayerProgress() {
        if (!filmVideo || !filmPlayerSeek || !filmPlayerCurrent || !filmPlayerDuration) {
            return;
        }

        const duration = Number.isFinite(filmVideo.duration) ? filmVideo.duration : 0;
        filmPlayerSeek.value = duration ? String(Math.round((filmVideo.currentTime / duration) * 1000)) : '0';
        filmPlayerCurrent.textContent = formatVideoTime(filmVideo.currentTime);
        filmPlayerDuration.textContent = formatVideoTime(duration);
    }

    function updateFilmPlayButton() {
        if (!filmVideo || !filmPlayerToggle) {
            return;
        }

        const isPlaying = !filmVideo.paused;
        filmPlayerToggle.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproduzir');
        filmPlayerToggle.innerHTML = isPlaying
            ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h4v14H7zm6 0h4v14h-4z"></path></svg>'
            : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z"></path></svg>';
    }

    function playFilmVideo() {
        if (!filmVideo) {
            return;
        }

        filmVideo.play().then(() => setFilmPlayerStatus('')).catch((error) => {
            if (error.name !== 'AbortError') {
                setFilmPlayerStatus('Não foi possível reproduzir o vídeo. Tente novamente.');
            }
        });
    }

    function changeFilmSource(quality, currentTime = 0, shouldResume = false) {
        if (!filmVideo) {
            return;
        }
        const nextSource = filmVideoSources[quality];
        if (!nextSource) {
            setFilmPlayerStatus('Essa qualidade não está disponível.');
            return;
        }
        filmVideo.addEventListener('loadedmetadata', () => {
            filmVideo.currentTime = Math.min(currentTime, Number.isFinite(filmVideo.duration) ? filmVideo.duration : currentTime);
            if (shouldResume) {
                playFilmVideo();
            }
        }, { once: true });
        filmVideo.src = nextSource;
        filmVideo.load();
    }

    function closeFilmVideoDialog() {
        if (!filmVideoDialog?.open || filmVideoDialog.classList.contains('is-closing')) {
            return;
        }

        filmVideoDialog.classList.remove('is-open');
        filmVideoDialog.classList.add('is-closing');
        filmVideo?.pause();
        closeFilmVideoTimer = window.setTimeout(
            () => filmVideoDialog.close(),
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650
        );
    }

    filmVideoTrigger?.addEventListener('click', () => {
        if (!filmVideoDialog || !filmVideoContent || !filmVideo || !filmVideoTrigger.dataset.videoSrc) {
            return;
        }

        const initialQuality = preferredFilmQuality();
        if (filmPlayerQuality) {
            filmPlayerQuality.value = initialQuality;
        }
        changeFilmSource(initialQuality);
        setFilmPlayerStatus('');
        updateFilmPlayerProgress();
        updateFilmPlayButton();
        filmVideoDialog.showModal();
        document.body.classList.add('film-video-modal-open');
        filmVideoDialog.getBoundingClientRect();
        requestAnimationFrame(() => filmVideoDialog.classList.add('is-open'));
        filmVideoCloseButton?.focus({ preventScroll: true });
        playFilmVideo();
    });

    filmPlayerToggle?.addEventListener('click', () => {
        if (filmVideo?.paused) {
            playFilmVideo();
        } else {
            filmVideo?.pause();
        }
    });
    filmVideo?.addEventListener('play', updateFilmPlayButton);
    filmVideo?.addEventListener('pause', updateFilmPlayButton);
    filmVideo?.addEventListener('timeupdate', updateFilmPlayerProgress);
    filmVideo?.addEventListener('loadedmetadata', updateFilmPlayerProgress);
    filmVideo?.addEventListener('loadeddata', () => filmVideo.classList.add('is-ready'));
    filmVideo?.addEventListener('playing', () => {
        filmVideo.classList.add('is-ready');
        setFilmPlayerStatus('');
    });
    filmVideo?.addEventListener('waiting', () => setFilmPlayerStatus('Carregando vídeo…'));
    filmVideo?.addEventListener('error', () => {
        if (filmPlayerQuality && filmPlayerQuality.value !== '1080p' && filmVideoDialog?.open) {
            const failedQuality = filmPlayerQuality.value;
            filmPlayerQuality.value = '1080p';
            setFilmPlayerStatus(`A versão ${failedQuality} não está disponível. Tentando 1080p.`);
            changeFilmSource('1080p', filmVideo.currentTime, true);
            return;
        }
        setFilmPlayerStatus('Não foi possível carregar o vídeo. Tente novamente.');
    });

    filmPlayerSeek?.addEventListener('input', () => {
        if (filmVideo && Number.isFinite(filmVideo.duration)) {
            filmVideo.currentTime = (Number(filmPlayerSeek.value) / 1000) * filmVideo.duration;
            updateFilmPlayerProgress();
        }
    });

    filmPlayerMute?.addEventListener('click', () => {
        if (!filmVideo || !filmPlayerMute || !filmPlayerVolume) {
            return;
        }

        filmVideo.muted = !filmVideo.muted;
        filmPlayerMute.setAttribute('aria-pressed', String(filmVideo.muted));
        filmPlayerMute.setAttribute('aria-label', filmVideo.muted ? 'Ativar áudio' : 'Desativar áudio');
        filmPlayerVolume.value = filmVideo.muted ? '0' : String(filmVideo.volume);
    });
    filmPlayerVolume?.addEventListener('input', () => {
        if (filmVideo && filmPlayerMute) {
            filmVideo.volume = Number(filmPlayerVolume.value);
            filmVideo.muted = filmVideo.volume === 0;
            filmPlayerMute.setAttribute('aria-pressed', String(filmVideo.muted));
            filmPlayerMute.setAttribute('aria-label', filmVideo.muted ? 'Ativar áudio' : 'Desativar áudio');
        }
    });

    filmPlayerQuality?.addEventListener('change', () => {
        if (!filmVideo || !filmPlayerQuality) {
            return;
        }

        const currentTime = filmVideo.currentTime;
        const shouldResume = !filmVideo.paused;
        changeFilmSource(filmPlayerQuality.value, currentTime, shouldResume);
    });

    filmPlayerFullscreen?.addEventListener('click', () => {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        if (isFullscreen) {
            const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
            exitFullscreen?.call(document)?.catch?.(() => setFilmPlayerStatus('Não foi possível sair da tela cheia neste dispositivo.'));
            return;
        }
        if (filmVideo && typeof filmVideo.webkitEnterFullscreen === 'function') {
            filmVideo.webkitEnterFullscreen();
            return;
        }
        const fullscreenTarget = filmVideoContent;
        const requestFullscreen = fullscreenTarget?.requestFullscreen || fullscreenTarget?.webkitRequestFullscreen;
        const fullscreenAction = requestFullscreen?.call(fullscreenTarget);
        fullscreenAction?.catch?.(() => setFilmPlayerStatus('Não foi possível abrir a tela cheia neste dispositivo.'));
    });

    filmVideoCloseButton?.addEventListener('click', closeFilmVideoDialog);
    filmVideoDialog?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeFilmVideoDialog();
        }
    });
    filmVideoDialog?.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeFilmVideoDialog();
    });
    filmVideoDialog?.addEventListener('click', (event) => {
        if (event.target === filmVideoDialog) {
            closeFilmVideoDialog();
        }
    });
    filmVideoDialog?.addEventListener('close', () => {
        window.clearTimeout(closeFilmVideoTimer);
        filmVideoDialog.classList.remove('is-open', 'is-closing');
        document.body.classList.remove('film-video-modal-open');
        if (filmVideo) {
            filmVideo.pause();
            filmVideo.currentTime = 0;
            filmVideo.removeAttribute('src');
            filmVideo.load();
            filmVideo.classList.remove('is-ready');
        }
        setFilmPlayerStatus('');
        if (filmPlayerQuality) filmPlayerQuality.value = '1080p';
        if (filmPlayerVolume && filmVideo) {
            filmVideo.muted = false;
            filmVideo.volume = 1;
            filmPlayerVolume.value = '1';
        }
        if (filmPlayerMute) {
            filmPlayerMute.setAttribute('aria-pressed', 'false');
            filmPlayerMute.setAttribute('aria-label', 'Desativar áudio');
        }
        updateFilmPlayerProgress();
        updateFilmPlayButton();
        filmVideoTrigger?.focus({ preventScroll: true });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            videoDialog?.querySelector('video')?.pause();
            filmVideo?.pause();
        }
    });

});