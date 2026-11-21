package com.eldawly.alrafiq;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** يستقبل منبّه وقت الصلاة فيشغّل خدمة الأذان، ويعيد الجدولة بعد إعادة تشغيل الموبايل أو تغيير الوقت */
public class AdhanReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent in) {
        Intent s = new Intent(c, AdhanService.class).putExtras(in);
        try {
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(s); else c.startService(s);
        } catch (Exception e) {
            // لو النظام منع تشغيل الخدمة: نعرض شاشة الأذان كإشعار ملء الشاشة على الأقل
            AdhanService.postFallback(c, in.getStringExtra(AdhanAlarms.EXTRA_KEY), in.getStringExtra(AdhanAlarms.EXTRA_NAME), in.getStringExtra(AdhanAlarms.EXTRA_TIME));
        }
        // نتأكد إن باقي مواعيد الأسبوع لسه متجدولة (لو النظام مسحها لأي سبب)
        try { AdhanAlarms.scheduleAll(c); } catch (Exception ignored) {}
    }
}
