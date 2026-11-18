package com.eldawly.alrafiq;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** ويدجت المسبحة (٢×٢): تسبّح من الشاشة الرئيسية والعدد يتضاف لوردك لما تفتح التطبيق */
public class TasbihWidget extends AppWidgetProvider {
    static final String ADD = "com.eldawly.alrafiq.TASBIH_ADD";
    static final String NEXT = "com.eldawly.alrafiq.TASBIH_NEXT";
    static final String[][] FALLBACK = {
        {"subhanbihamdih", "سبحان الله وبحمده"}, {"istighfar", "أستغفر الله"}, {"salah", "اللهم صلِّ على محمد"},
        {"lailaha", "لا إله إلا الله"}, {"hawqala", "لا حول ولا قوة إلا بالله"},
    };

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, render(c));
    }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        String a = i.getAction();
        if (ADD.equals(a)) { add(c); buzz(c); }
        else if (NEXT.equals(a)) { SharedPreferences p = RafiqWidgets.prefs(c); p.edit().putInt("tsel", p.getInt("tsel", 0) + 1).apply(); }
        else return;
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        for (int id : m.getAppWidgetIds(new ComponentName(c, TasbihWidget.class))) m.updateAppWidget(id, render(c));
    }

    static JSONArray list(Context c) {
        JSONObject t = RafiqWidgets.data(c).optJSONObject("tasbih");
        JSONArray l = t != null ? t.optJSONArray("list") : null;
        if (l != null && l.length() > 0) return l;
        JSONArray f = new JSONArray();
        try { for (String[] x : FALLBACK) f.put(new JSONObject().put("id", x[0]).put("short", x[1])); } catch (Exception ignored) {}
        return f;
    }

    static JSONObject current(Context c) {
        JSONArray l = list(c);
        int sel = RafiqWidgets.prefs(c).getInt("tsel", 0);
        return l.optJSONObject(((sel % l.length()) + l.length()) % l.length());
    }

    /** العدّ المعلّق اللي لسه ماتنقلش للتطبيق: {date, c:{id:n}} */
    static JSONObject pending(Context c) {
        try {
            JSONObject p = new JSONObject(RafiqWidgets.prefs(c).getString("pending", "{}"));
            return p;
        } catch (Exception e) { return new JSONObject(); }
    }

    static synchronized void add(Context c) {
        try {
            JSONObject p = pending(c);
            String today = RafiqWidgets.today();
            if (!today.equals(p.optString("date"))) {
                // عدّ يوم سابق لم يُنقل: نحتفظ به في old حتى يأخذه التطبيق
                if (p.has("c") && p.optJSONObject("c").length() > 0) p.put("old", new JSONObject().put("date", p.optString("date")).put("c", p.optJSONObject("c")));
                p.put("date", today).put("c", new JSONObject());
            }
            String id = current(c).optString("id");
            JSONObject cnt = p.optJSONObject("c");
            cnt.put(id, cnt.optInt(id) + 1);
            RafiqWidgets.prefs(c).edit().putString("pending", p.toString()).apply();
        } catch (Exception ignored) {}
    }

    static int countOf(Context c, String id) {
        String today = RafiqWidgets.today();
        int base = 0;
        JSONObject t = RafiqWidgets.data(c).optJSONObject("tasbih");
        if (t != null && today.equals(t.optString("date"))) {
            JSONArray l = t.optJSONArray("list");
            for (int i = 0; l != null && i < l.length(); i++) if (id.equals(l.optJSONObject(i).optString("id"))) base = l.optJSONObject(i).optInt("base");
        }
        JSONObject p = pending(c);
        int pend = today.equals(p.optString("date")) && p.optJSONObject("c") != null ? p.optJSONObject("c").optInt(id) : 0;
        return base + pend;
    }

    static void buzz(Context c) {
        try {
            Vibrator v = (Vibrator) c.getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) v.vibrate(VibrationEffect.createOneShot(12, 80));
            else v.vibrate(12);
        } catch (Exception ignored) {}
    }

    static RemoteViews render(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_tasbih);
        JSONObject cur = current(c);
        String id = cur.optString("id");
        int n = countOf(c, id);
        int goal = 100;
        v.setTextViewText(R.id.tz_text, cur.optString("short"));
        v.setTextViewText(R.id.tz_count, RafiqWidgets.ar(n));
        int lap = n % goal;
        v.setProgressBar(R.id.tz_bar, goal, n > 0 && lap == 0 ? goal : lap, false);
        v.setTextViewText(R.id.tz_goal, n >= goal ? "✓ " + RafiqWidgets.ar(n / goal) + " × ١٠٠" : "من ١٠٠");
        v.setOnClickPendingIntent(R.id.tz_tap, RafiqWidgets.broadcast(c, TasbihWidget.class, ADD, 801));
        v.setOnClickPendingIntent(R.id.tz_next, RafiqWidgets.broadcast(c, TasbihWidget.class, NEXT, 802));
        v.setOnClickPendingIntent(R.id.tz_open, RafiqWidgets.open(c, "/wird", 803));
        return v;
    }
}
