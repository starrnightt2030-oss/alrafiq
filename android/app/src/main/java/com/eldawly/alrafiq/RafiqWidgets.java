package com.eldawly.alrafiq;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/** بيانات ورسم ويدجتات الرفيق — البيانات يكتبها التطبيق (JS) في SharedPreferences */
public class RafiqWidgets {
    static final String PREFS = "rafiq_widget";
    static final String ACTION_REFRESH = "com.eldawly.alrafiq.WIDGET_REFRESH";
    static final int GOLD = 0xFFE8BE5C, WHITE = 0xFFFFFFFF, DIM = 0x99FFFFFF, DARK = 0xFF0A231E;

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static JSONObject data(Context c) {
        try { return new JSONObject(prefs(c).getString("data", "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()); }

    static String ar(String s) {
        StringBuilder b = new StringBuilder();
        for (char ch : s.toCharArray()) b.append(ch >= '0' && ch <= '9' ? (char) ('٠' + (ch - '0')) : ch);
        return b.toString();
    }
    static String ar(long n) { return ar(String.valueOf(n)); }

    /** الصلاة القادمة (بدون الشروق): [day, index] أو null لو البيانات قديمة */
    static int[] next(JSONObject d, long now) {
        JSONArray days = d.optJSONArray("days");
        if (days == null) return null;
        for (int i = 0; i < days.length(); i++) {
            JSONArray p = days.optJSONObject(i).optJSONArray("p");
            if (p == null) continue;
            for (int j = 0; j < p.length(); j++) {
                JSONObject x = p.optJSONObject(j);
                if (x.optBoolean("info")) continue;
                if (x.optLong("t") > now) return new int[]{i, j};
            }
        }
        return null;
    }

    static PendingIntent open(Context c, String path, int req) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("alrafiq://open" + path));
        i.setClass(c, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent broadcast(Context c, Class<?> cls, String action, int req) {
        Intent i = new Intent(c, cls).setAction(action);
        return PendingIntent.getBroadcast(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] a = m.getAppWidgetIds(new ComponentName(c, PrayerWidget.class));
        for (int id : a) m.updateAppWidget(id, renderPrayer(c, R.layout.widget_prayer));
        int[] b = m.getAppWidgetIds(new ComponentName(c, NextWidget.class));
        for (int id : b) m.updateAppWidget(id, renderPrayer(c, R.layout.widget_next));
        int[] t = m.getAppWidgetIds(new ComponentName(c, TasbihWidget.class));
        for (int id : t) m.updateAppWidget(id, TasbihWidget.render(c));
        if (a.length + b.length > 0) scheduleNext(c);
    }

    /** تحديث تلقائي عند كل صلاة وعند منتصف الليل */
    static void scheduleNext(Context c) {
        long now = System.currentTimeMillis();
        JSONObject d = data(c);
        int[] n = next(d, now);
        Calendar mid = Calendar.getInstance();
        mid.add(Calendar.DAY_OF_YEAR, 1); mid.set(Calendar.HOUR_OF_DAY, 0); mid.set(Calendar.MINUTE, 0); mid.set(Calendar.SECOND, 5);
        long at = mid.getTimeInMillis();
        if (n != null) {
            long t = d.optJSONArray("days").optJSONObject(n[0]).optJSONArray("p").optJSONObject(n[1]).optLong("t") + 2000;
            if (t < at) at = t;
        }
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = broadcast(c, PrayerWidget.class, ACTION_REFRESH, 900);
        try {
            boolean exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
            if (exact && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) am.setExactAndAllowWhileIdle(AlarmManager.RTC, at, pi);
            else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) am.setAndAllowWhileIdle(AlarmManager.RTC, at, pi);
            else am.set(AlarmManager.RTC, at, pi);
        } catch (Exception e) {
            am.set(AlarmManager.RTC, at, pi);
        }
    }

    static final int[] COL = {R.id.p0, R.id.p1, R.id.p2, R.id.p3, R.id.p4};
    static final int[] NAME = {R.id.n0, R.id.n1, R.id.n2, R.id.n3, R.id.n4};
    static final int[] TIME = {R.id.t0, R.id.t1, R.id.t2, R.id.t3, R.id.t4};

    static RemoteViews renderPrayer(Context c, int layout) {
        RemoteViews v = new RemoteViews(c.getPackageName(), layout);
        boolean full = layout == R.layout.widget_prayer;
        long now = System.currentTimeMillis();
        JSONObject d = data(c);
        v.setOnClickPendingIntent(R.id.root, open(c, "/prayer", full ? 1 : 2));
        int[] n = next(d, now);
        if (n == null) {
            v.setTextViewText(R.id.next_name, "افتح الرفيق");
            v.setTextViewText(R.id.next_time, "لتحديث المواقيت");
            v.setViewVisibility(R.id.countdown, View.GONE);
            return v;
        }
        JSONArray days = d.optJSONArray("days");
        JSONObject nx = days.optJSONObject(n[0]).optJSONArray("p").optJSONObject(n[1]);
        v.setTextViewText(R.id.next_name, nx.optString("n"));
        v.setTextViewText(R.id.next_time, nx.optString("s"));
        v.setTextViewText(R.id.city, d.optString("city"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            long base = SystemClock.elapsedRealtime() + (nx.optLong("t") - now);
            v.setChronometer(R.id.countdown, base, null, true);
            v.setChronometerCountDown(R.id.countdown, true);
            v.setViewVisibility(R.id.countdown, View.VISIBLE);
            v.setViewVisibility(R.id.left_label, View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.countdown, View.GONE);
            v.setViewVisibility(R.id.left_label, View.GONE);
        }

        // حالة الأذكار والسلسلة
        JSONObject az = d.optJSONObject("azkar");
        boolean fresh = az != null && today().equals(az.optString("date"));
        boolean am = fresh && az.optBoolean("m"), pm = fresh && az.optBoolean("e");
        v.setTextViewText(R.id.az_m, (am ? "✓ " : "☀ ") + "الصباح");
        v.setTextViewText(R.id.az_e, (pm ? "✓ " : "☾ ") + "المساء");
        v.setInt(R.id.az_m, "setBackgroundResource", am ? R.drawable.wg_chip_on : R.drawable.wg_chip);
        v.setInt(R.id.az_e, "setBackgroundResource", pm ? R.drawable.wg_chip_on : R.drawable.wg_chip);
        v.setTextColor(R.id.az_m, am ? DARK : WHITE);
        v.setTextColor(R.id.az_e, pm ? DARK : WHITE);
        v.setOnClickPendingIntent(R.id.az_m, open(c, "/azkar/morning", full ? 3 : 4));
        v.setOnClickPendingIntent(R.id.az_e, open(c, "/azkar/evening", full ? 5 : 6));
        int streak = d.optInt("streak");
        v.setTextViewText(R.id.streak, streak > 0 ? "🔥 " + ar(streak) : "");

        if (full) {
            v.setTextViewText(R.id.hijri, d.optString("hijri"));
            // مواقيت اليوم الذي فيه الصلاة القادمة
            JSONArray p = days.optJSONObject(n[0]).optJSONArray("p");
            int col = 0;
            for (int j = 0; j < p.length() && col < 5; j++) {
                JSONObject x = p.optJSONObject(j);
                if (x.optBoolean("info")) continue;
                boolean on = j == n[1];
                v.setTextViewText(NAME[col], x.optString("n"));
                v.setTextViewText(TIME[col], x.optString("s").replace(" ص", "").replace(" م", ""));
                v.setInt(COL[col], "setBackgroundResource", on ? R.drawable.wg_pill : 0);
                v.setTextColor(NAME[col], on ? DARK : DIM);
                v.setTextColor(TIME[col], on ? DARK : WHITE);
                col++;
            }
        }
        return v;
    }
}
