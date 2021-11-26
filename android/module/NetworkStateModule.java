package com.esv2.NetworkState.module;

import android.os.Build;

import androidx.annotation.NonNull;

import com.esv2.NetworkState.main.BroadcastReceiverConnectivityReceiver;
import com.esv2.NetworkState.main.ConnectivityReceiver;
import com.esv2.NetworkState.main.NetworkCallbackConnectivityReceiver;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class NetworkStateModule extends ReactContextBaseJavaModule {
    private final ConnectivityReceiver mConnectivityReceiver;
    public NetworkStateModule(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mConnectivityReceiver = new NetworkCallbackConnectivityReceiver(reactContext);
        } else {
            mConnectivityReceiver = new BroadcastReceiverConnectivityReceiver(reactContext);
        }
    }

    @Override
    public void initialize() {
        mConnectivityReceiver.register();
    }

    @Override
    public void onCatalystInstanceDestroy() {
        mConnectivityReceiver.unregister();
    }

    @Override
    public String getName() {
        return "NetworkState";
    }

    @ReactMethod
    public void getCurrentState(final String requestedInterface, final Promise promise) {
        mConnectivityReceiver.getCurrentState(requestedInterface, promise);
    }


    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
    }
}
