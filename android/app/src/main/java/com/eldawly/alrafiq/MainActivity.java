package com.eldawly.alrafiq;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    static volatile boolean visible = false;
    @Override public void onResume() { super.onResume(); visible = true; }
    @Override public void onPause() { visible = false; super.onPause(); }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetPlugin.class);
        registerPlugin(AdhanPlugin.class);
        super.onCreate(savedInstanceState);
        // تثبيت مقاس الواجهة: تكبير الخط من إعدادات الموبايل كان بيكبّر الصفحة ويخليها تتحرك يمين وشمال
        try {
            WebSettings ws = getBridge().getWebView().getSettings();
            ws.setTextZoom(100);
            ws.setSupportZoom(false);
            ws.setBuiltInZoomControls(false);
            ws.setDisplayZoomControls(false);
            ws.setUseWideViewPort(true);
            ws.setLoadWithOverviewMode(true);
            getBridge().getWebView().setHorizontalScrollBarEnabled(false);
            getBridge().getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
        } catch (Exception ignored) {}
    }
}
