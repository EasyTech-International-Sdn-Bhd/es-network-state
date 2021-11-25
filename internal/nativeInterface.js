/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import { NativeEventEmitter } from 'react-native';
import NetworkState from "./nativeModule";
// Produce an error if we don't have the native module
if (!NetworkState) {
    throw new Error(`NetworkState is not setup yet`);
}
/**
 * We export the native interface in this way to give easy shared access to it between the
 * JavaScript code and the tests
 */
let nativeEventEmitter = null;
export default Object.assign(Object.assign({}, NetworkState), { get eventEmitter() {
        if (!nativeEventEmitter) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            /// @ts-ignore
            nativeEventEmitter = new NativeEventEmitter(NetworkState);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        /// @ts-ignore
        return nativeEventEmitter;
    } });
