package com.esv2.NetworkState.types;

import android.net.NetworkInfo;
import android.telephony.TelephonyManager;

import androidx.annotation.Nullable;

public enum CellularGeneration {
    CG_2G("2g"),
    CG_3G("3g"),
    CG_4G("4g"),
    CG_5G("5g");

    public final String label;

    CellularGeneration(String label) {
        this.label = label;
    }

    @Nullable
    public static CellularGeneration fromNetworkInfo(@Nullable NetworkInfo networkInfo) {
        if (networkInfo == null) {
            return null;
        }

        switch (networkInfo.getSubtype()) {
            case TelephonyManager.NETWORK_TYPE_1xRTT:
            case TelephonyManager.NETWORK_TYPE_CDMA:
            case TelephonyManager.NETWORK_TYPE_EDGE:
            case TelephonyManager.NETWORK_TYPE_GPRS:
            case TelephonyManager.NETWORK_TYPE_IDEN:
                return CellularGeneration.CG_2G;
            case TelephonyManager.NETWORK_TYPE_EHRPD:
            case TelephonyManager.NETWORK_TYPE_EVDO_0:
            case TelephonyManager.NETWORK_TYPE_EVDO_A:
            case TelephonyManager.NETWORK_TYPE_EVDO_B:
            case TelephonyManager.NETWORK_TYPE_HSDPA:
            case TelephonyManager.NETWORK_TYPE_HSPA:
            case TelephonyManager.NETWORK_TYPE_HSUPA:
            case TelephonyManager.NETWORK_TYPE_UMTS:
                return CellularGeneration.CG_3G;
            case TelephonyManager.NETWORK_TYPE_HSPAP:
            case TelephonyManager.NETWORK_TYPE_LTE:
                return CellularGeneration.CG_4G;
            case TelephonyManager.NETWORK_TYPE_UNKNOWN:
            default:
                return null;
        }
    }
}
