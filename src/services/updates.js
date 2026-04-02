(() => {
    const getElectronApi = () => window.electronAPI ?? null;

    const isAvailable = () => {
        const electronApi = getElectronApi();
        return Boolean(
            electronApi && (
                typeof electronApi.checkForUpdates === 'function' ||
                typeof electronApi.installUpdate === 'function' ||
                typeof electronApi.getAppVersion === 'function'
            )
        );
    };

    const checkForUpdates = () => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.checkForUpdates !== 'function') return false;
        electronApi.checkForUpdates();
        return true;
    };

    const installUpdate = () => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.installUpdate !== 'function') return false;
        electronApi.installUpdate();
        return true;
    };

    const getAppVersion = async () => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.getAppVersion !== 'function') return '—';
        return electronApi.getAppVersion();
    };

    const getFullChangelog = async () => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.getFullChangelog !== 'function') return '';
        return electronApi.getFullChangelog();
    };

    const getChangelogForVersion = async (version) => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.getChangelogForVersion !== 'function') return '';
        return electronApi.getChangelogForVersion(version);
    };

    const onDownloaded = (callback) => {
        const electronApi = getElectronApi();
        if (typeof callback !== 'function' || typeof electronApi?.onUpdateDownloaded !== 'function') {
            return false;
        }

        electronApi.onUpdateDownloaded((info) => callback(info));
        return true;
    };

    const onDownloadProgress = (callback) => {
        const electronApi = getElectronApi();
        if (typeof callback !== 'function' || typeof electronApi?.onDownloadProgress !== 'function') {
            return false;
        }

        electronApi.onDownloadProgress((pct) => callback(pct));
        return true;
    };

    const onCheckResult = (callback) => {
        const electronApi = getElectronApi();
        if (typeof callback !== 'function' || typeof electronApi?.onUpdateCheckResult !== 'function') {
            return false;
        }

        electronApi.onUpdateCheckResult((result) => callback(result));
        return true;
    };

    window.FocoZenUpdateService = Object.freeze({
        isAvailable,
        checkForUpdates,
        installUpdate,
        getAppVersion,
        getFullChangelog,
        getChangelogForVersion,
        onDownloaded,
        onDownloadProgress,
        onCheckResult
    });
})();
