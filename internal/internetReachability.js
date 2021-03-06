/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
export default class InternetReachability {
    constructor(configuration, listener) {
        this._isInternetReachable = undefined;
        this._currentInternetReachabilityCheckHandler = null;
        this._currentTimeoutHandle = null;
        this._setIsInternetReachable = (isInternetReachable) => {
            if (this._isInternetReachable === isInternetReachable) {
                return;
            }
            this._isInternetReachable = isInternetReachable;
            this._listener(this._isInternetReachable);
        };
        this._setExpectsConnection = (expectsConnection) => {
            // Cancel any pending check
            if (this._currentInternetReachabilityCheckHandler !== null) {
                this._currentInternetReachabilityCheckHandler.cancel();
                this._currentInternetReachabilityCheckHandler = null;
            }
            // Cancel any pending timeout
            if (this._currentTimeoutHandle !== null) {
                clearTimeout(this._currentTimeoutHandle);
                this._currentTimeoutHandle = null;
            }
            if (expectsConnection && this._configuration.reachabilityShouldRun()) {
                // If we expect a connection, start the process for finding if we have one
                // Set the state to "null" if it was previously false
                if (!this._isInternetReachable) {
                    this._setIsInternetReachable(null);
                }
                // Start a network request to check for internet
                this._currentInternetReachabilityCheckHandler = this._checkInternetReachability();
            }
            else {
                // If we don't expect a connection or don't run reachability check, just change the state to "false"
                this._setIsInternetReachable(false);
            }
        };
        this._checkInternetReachability = () => {
            const responsePromise = fetch(this._configuration.reachabilityUrl, {
                method: 'HEAD',
                cache: 'no-cache',
            });
            // Create promise that will reject after the request timeout has been reached
            let timeoutHandle;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => reject('timedout'), this._configuration.reachabilityRequestTimeout);
            });
            // Create promise that makes it possible to cancel a pending request through a reject
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            let cancel = () => { };
            const cancelPromise = new Promise((_, reject) => {
                cancel = () => reject('canceled');
            });
            const promise = Promise.race([
                responsePromise,
                timeoutPromise,
                cancelPromise,
            ])
                .then((response) => {
                    return this._configuration.reachabilityTest(response);
                })
                .then((result) => {
                    this._setIsInternetReachable(result);
                    const nextTimeoutInterval = this._isInternetReachable
                        ? this._configuration.reachabilityLongTimeout
                        : this._configuration.reachabilityShortTimeout;
                    this._currentTimeoutHandle = setTimeout(this._checkInternetReachability, nextTimeoutInterval);
                })
                .catch((error) => {
                    if (error !== 'canceled') {
                        this._setIsInternetReachable(false);
                        this._currentTimeoutHandle = setTimeout(this._checkInternetReachability, this._configuration.reachabilityShortTimeout);
                    }
                })
                // Clear request timeout and propagate any errors
                .then(() => {
                    clearTimeout(timeoutHandle);
                }, (error) => {
                    clearTimeout(timeoutHandle);
                    throw error;
                });
            return {
                promise,
                cancel,
            };
        };
        this.update = (state) => {
            if (typeof state.isInternetReachable === 'boolean') {
                this._setIsInternetReachable(state.isInternetReachable);
            }
            else {
                this._setExpectsConnection(state.isConnected);
            }
        };
        this.currentState = () => {
            return this._isInternetReachable;
        };
        this.tearDown = () => {
            // Cancel any pending check
            if (this._currentInternetReachabilityCheckHandler !== null) {
                this._currentInternetReachabilityCheckHandler.cancel();
                this._currentInternetReachabilityCheckHandler = null;
            }
            // Cancel any pending timeout
            if (this._currentTimeoutHandle !== null) {
                clearTimeout(this._currentTimeoutHandle);
                this._currentTimeoutHandle = null;
            }
        };
        this._configuration = configuration;
        this._listener = listener;
    }
}
