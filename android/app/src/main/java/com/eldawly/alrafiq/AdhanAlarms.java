package com.eldawly.alrafiq;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** جدولة منبّهات الأذان الدقيقة (تعمل والتطبيق مقفول، وبعد إعادة التشغيل) */
public final class AdhanAlarms {
    static final String PREFS = "rafiq_adhan";
    static final String EXTRA_KEY = "key", EXTRA_NAME = "name", EXTRA_TIME = "time";
    private AdhanAlarms() {}

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static PendingIntent pi(Context c, int slot, Intent i, int extra) {
        return PendingIntent.getBroadcast(c, 7000 + slot, i, PendingIntent.FLAG_IMMUTABLE | extra);
    }

    static boolean canExact(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
    }

    /** يلغي المنبّهات القديمة ويجدول القائمة المحفوظة من جديد */
    static void scheduleAll(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        SharedPreferences p = prefs(c);
        int old = p.getInt("count", 0);
        for (int k = 0; k < Math.max(old, 64); k++) {
            PendingIntent x = pi(c, k, new Intent(c, AdhanReceiver.class), PendingIntent.FLAG_NO_CREATE);
            if (x != null) { am.cancel(x); x.cancel(); }
        }
        int n = 0;
        try {
            JSONArray items = new JSONArray(p.getString("items", "[]"));
            long now = System.currentTimeMillis();
            for (int k = 0; k < items.length() && n < 64; k++) {
                JSONObject o = items.getJSONObject(k);
                long at = o.getLong("at");
                if (at <= now) continue;
                Intent i = new Intent(c, AdhanReceiver.class)
                        .putExtra(EXTRA_KEY, o.optString("key"))
                        .putExtra(EXTRA_NAME, o.optString("name"))
                        .putExtra(EXTRA_TIME, o.optString("time"));
                PendingIntent op = pi(c, n++, i, PendingIntent.FLAG_UPDATE_CURRENT);
                if (canExact(c)) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, op);
                else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, op);
            }
        } catch (Exception ignored) {}
        p.edit().putInt("count", n).apply();
    }
}
