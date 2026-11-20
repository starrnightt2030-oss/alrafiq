package com.eldawly.alrafiq;

import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** جسر الأذان: يستلم مواعيد الصلاة من التطبيق ويجدولها كمنبّهات تفتح شاشة الأذان */
@CapacitorPlugin(name = "Adhan")
public class AdhanPlugin extends Plugin {
    @PluginMethod
    public void schedule(PluginCall call) {
        String items = call.getString("items", "[]");
        AdhanAlarms.prefs(getContext()).edit()
                .putString("items", items)
                .putFloat("volume", call.getFloat("volume", 1f))
                .putBoolean("dua", call.getBoolean("dua", true))
                .apply();
        AdhanAlarms.scheduleAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try { getContext().startService(new Intent(getContext(), AdhanService.class).setAction(AdhanService.ACTION_STOP)); } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        boolean fs = true;
        if (Build.VERSION.SDK_INT >= 34) fs = getContext().getSystemService(NotificationManager.class).canUseFullScreenIntent();
        r.put("fullScreen", fs);
        r.put("exact", AdhanAlarms.canExact(getContext()));
        r.put("playing", AdhanService.running);
        call.resolve(r);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        String what = call.getString("what", "fullScreen");
        Uri pkg = Uri.parse("package:" + getContext().getPackageName());
        Intent i = null;
        if ("fullScreen".equals(what) && Build.VERSION.SDK_INT >= 34) i = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, pkg);
        else if ("exact".equals(what) && Build.VERSION.SDK_INT >= 31) i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg);
        if (i == null) i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); } catch (Exception e) {
            getContext().startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        call.resolve();
    }
}
