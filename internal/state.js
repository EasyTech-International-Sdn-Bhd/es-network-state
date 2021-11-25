/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import NativeInterface from './nativeInterface';
import InternetReachability from './internetReachability';
import * as PrivateTypes from './privateTypes';
export default class State {
    constructor(configuration) {
        this._nativeEventSubscription = null;
        this._subscriptions = new Set();
        this._latestState = null;
        this._handleNativeStateUpdate = (state) => {
            // Update the internet reachability module
            this._internetReachability.update(state);
            // Convert the state from native to JS shape
            const convertedState = this._convertState(state);
            // Update the listeners
            this._latestState = convertedState;
            this._subscriptions.forEach((handler) => handler(convertedState));
        };
        this._handleInternetReachabilityUpdate = (isInternetReachable) => {
            if (!this._latestState) {
                return;
            }
            const nextState = Object.assign(Object.assign({}, this._latestState), { isInternetReachable });
            this._latestState = nextState;
            this._subscriptions.forEach((handler) => handler(nextState));
        };
        this._fetchCurrentState = async (requestedInterface) => {
            const state = await NativeInterface.getCurrentState(requestedInterface);
            // Update the internet reachability module
            this._internetReachability.update(state);
            // Convert and store the new state
            const convertedState = this._convertState(state);
            if (!requestedInterface) {
                this._latestState = convertedState;
            }
            return convertedState;
        };
        this._convertState = (input) => {
            if (typeof input.isInternetReachable === 'boolean') {
                return input;
            }
            else {
                return Object.assign(Object.assign({}, input), { isInternetReachable: this._internetReachability.currentState() });
            }
        };
        this.latest = (requestedInterface) => {
            if (requestedInterface) {
                return this._fetchCurrentState(requestedInterface);
            }
            else if (this._latestState) {
                return Promise.resolve(this._latestState);
            }
            else {
                return this._fetchCurrentState();
            }
        };
        this.add = (handler) => {
            // Add the subscription handler to our set
            this._subscriptions.add(handler);
            // Send it the latest data we have
            if (this._latestState) {
                handler(this._latestState);
            }
            else {
                this.latest().then(handler);
            }
        };
        this.remove = (handler) => {
            this._subscriptions.delete(handler);
        };
        this.tearDown = () => {
            if (this._internetReachability) {
                this._internetReachability.tearDown();
            }
            if (this._nativeEventSubscription) {
                this._nativeEventSubscription.remove();
            }
            this._subscriptions.clear();
        };
        // Add the listener to the internet connectivity events
        this._internetReachability = new InternetReachability(configuration, this._handleInternetReachabilityUpdate);
        // Add the subscription to the native events
        this._nativeEventSubscription = NativeInterface.eventEmitter.addListener(PrivateTypes.DEVICE_CONNECTIVITY_EVENT, this._handleNativeStateUpdate);
        // Fetch the current state from the native module
        this._fetchCurrentState();
    }
}
