package com.esv2.NetworkState.main;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import com.facebook.react.bridge.ReactApplicationContext;

import com.esv2.NetworkState.types.CellularGeneration;
import com.esv2.NetworkState.types.ConnectionType;

@SuppressWarnings("deprecation")
public class BroadcastReceiverConnectivityReceiver extends ConnectivityReceiver {
    private final ConnectivityBroadcastReceiver mConnectivityBroadcastReceiver;
    public static final String CONNECTIVITY_ACTION = "android.net.conn.CONNECTIVITY_CHANGE";
    private ReactApplicationContext mContext = null;
    public BroadcastReceiverConnectivityReceiver(ReactApplicationContext reactContext) {
        super(reactContext);
        mConnectivityBroadcastReceiver = new ConnectivityBroadcastReceiver();
        this.mContext = reactContext;
    }

    @Override
    public void register() {
        IntentFilter filter = new IntentFilter();
        filter.addAction(CONNECTIVITY_ACTION);
        this.mContext.registerReceiver(mConnectivityBroadcastReceiver, filter);
        mConnectivityBroadcastReceiver.setRegistered(true);
        updateAndSendConnectionType();
    }

    @Override
    public void unregister() {
        if (mConnectivityBroadcastReceiver.isRegistered()) {
            this.mContext.unregisterReceiver(mConnectivityBroadcastReceiver);
            mConnectivityBroadcastReceiver.setRegistered(false);
        }
    }

    @SuppressLint("MissingPermission")
    private void updateAndSendConnectionType() {
        ConnectionType connectionType = ConnectionType.UNKNOWN;
        CellularGeneration cellularGeneration = null;
        boolean isInternetReachable = false;

        try {
            NetworkInfo networkInfo = getConnectivityManager().getActiveNetworkInfo();
            if (networkInfo == null || !networkInfo.isConnected()) {
                connectionType = ConnectionType.NONE;
            } else {
                // Check if the internet is reachable
                isInternetReachable = networkInfo.isConnected();

                // Get the connection type
                int networkType = networkInfo.getType();
                switch (networkType) {
                    case ConnectivityManager.TYPE_BLUETOOTH:
                        connectionType = ConnectionType.BLUETOOTH;
                        break;
                    case ConnectivityManager.TYPE_ETHERNET:
                        connectionType = ConnectionType.ETHERNET;
                        break;
                    case ConnectivityManager.TYPE_MOBILE:
                    case ConnectivityManager.TYPE_MOBILE_DUN:
                        connectionType = ConnectionType.CELLULAR;
                        cellularGeneration = CellularGeneration.fromNetworkInfo(networkInfo);
                        break;
                    case ConnectivityManager.TYPE_WIFI:
                        connectionType = ConnectionType.WIFI;
                        break;
                    case ConnectivityManager.TYPE_WIMAX:
                        connectionType = ConnectionType.WIMAX;
                        break;
                    case ConnectivityManager.TYPE_VPN:
                        connectionType = ConnectionType.VPN;
                        break;
                }
            }
        } catch (SecurityException e) {
            connectionType = ConnectionType.UNKNOWN;
        }

        updateConnectivity(connectionType, cellularGeneration, isInternetReachable);
    }

    /**
     * Class that receives intents whenever the connection type changes. NB: It is possible on some
     * devices to receive certain connection type changes multiple times.
     */
    private class ConnectivityBroadcastReceiver extends BroadcastReceiver {

        // TODO: Remove registered check when source of crash is found. t9846865
        private boolean isRegistered = false;

        public void setRegistered(boolean registered) {
            isRegistered = registered;
        }

        public boolean isRegistered() {
            return isRegistered;
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (action != null && action.equals(CONNECTIVITY_ACTION)) {
                updateAndSendConnectionType();
            }
        }
    }
}
