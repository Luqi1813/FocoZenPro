(() => {
    const getElectronApi = () => window.electronAPI ?? null;

    const isAvailable = () => {
        const electronApi = getElectronApi();
        return Boolean(
            electronApi && (
                typeof electronApi.enterPip === 'function' ||
                typeof electronApi.sendPipState === 'function' ||
                typeof electronApi.sendPipAction === 'function' ||
                typeof electronApi.onPipAction === 'function'
            )
        );
    };

    const enter = () => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.enterPip !== 'function') return false;
        electronApi.enterPip();
        return true;
    };

    const sendState = (state) => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.sendPipState !== 'function') return false;
        electronApi.sendPipState(state);
        return true;
    };

    const sendAction = (action, data) => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.sendPipAction !== 'function') return false;
        electronApi.sendPipAction(action, data);
        return true;
    };

    const onAction = (callback) => {
        const electronApi = getElectronApi();
        if (typeof callback !== 'function' || typeof electronApi?.onPipAction !== 'function') {
            return false;
        }

        electronApi.onPipAction((action, data) => callback(action, data));
        return true;
    };

    const onCloseRequested = (callback) => {
        if (typeof callback !== 'function') return false;

        return onAction((action, data) => {
            if (action === 'restore-app') {
                callback(data);
            }
        });
    };

    const setVolume = (volume) => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.setVolume === 'function') {
            electronApi.setVolume(volume);
            return true;
        }

        return sendAction('set-volume', volume);
    };

    const requestMinimizeToTray = () => sendAction('minimize-to-tray');

    const requestQuitApp = () => {
        const electronApi = getElectronApi();
        if (typeof electronApi?.closeApp === 'function') {
            electronApi.closeApp();
            return true;
        }

        return sendAction('quit-app');
    };

    window.FocoZenPipService = Object.freeze({
        isAvailable,
        enter,
        sendState,
        sendAction,
        onAction,
        onCloseRequested,
        setVolume,
        requestMinimizeToTray,
        requestQuitApp
    });
})();
