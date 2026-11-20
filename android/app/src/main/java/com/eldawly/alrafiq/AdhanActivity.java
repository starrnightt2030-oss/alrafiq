package com.eldawly.alrafiq;

import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.lang.ref.WeakReference;

/** شاشة الأذان الكاملة: تظهر فوق قفل الشاشة وتفضل ثابتة لحد ما الأذان والدعاء يخلصوا */
public class AdhanActivity extends Activity {
    private static WeakReference<AdhanActivity> current = new WeakReference<>(null);
    static void closeAll() { AdhanActivity a = current.get(); if (a != null) a.runOnUiThread(a::finishAndRemoveTask); }

    static final String T = "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ", SH = "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ", RS = "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
            HS = "حَيَّ عَلَى الصَّلَاةِ", HF = "حَيَّ عَلَى الْفَلَاحِ", L = "لَا إِلَٰهَ إِلَّا اللَّهُ", HAWQ = "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
            DUA = "اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ";
    // توقيت كل جملة بالثانية في تسجيل الشيخ نصر الدين طوبار (نفس توقيتات التطبيق)
    static final double[] CA = {0, 12.7, 30.5, 47.3, 65.8, 86.6, 107.5, 127.4, 149.8, 163.9, 182.9, 197.4};
    static final double[] CF = {0, 18.8, 39, 59.5, 78.8, 101.2, 114.6, 136.4, 148.8, 172.5, 185.8, 199.2};
    static final String[] TX = {T, T, SH, SH, RS, RS, HS, HS, HF, HF, T, L};
    static final String[][] SKY = {
            {"fajr", "#0B1636", "#2B2E6B", "#C76B7E"}, {"dhuhr", "#0E4E7A", "#2E86B8", "#5FA9D1"},
            {"asr", "#3A2A12", "#8C5A1F", "#C98A35"}, {"maghrib", "#1B0F2E", "#5A2350", "#B5423C"}, {"isha", "#03060F", "#0A1430", "#203A73"}};

    private final Handler h = new Handler(Looper.getMainLooper());
    private TextView phrase, reply, label;
    private int last = -2;

    private int dp(float v) { return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()); }
    private TextView tv(String s, float sp, int color, boolean bold) {
        TextView t = new TextView(this); t.setText(s); t.setTextSize(sp); t.setTextColor(color); t.setGravity(Gravity.CENTER);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD); t.setLineSpacing(0, 1.25f); return t;
    }
    private TextView button(String s, boolean primary, View.OnClickListener on) {
        TextView b = tv(s, 18, primary ? Color.parseColor("#2A1C05") : Color.WHITE, true);
        GradientDrawable g = new GradientDrawable(); g.setCornerRadius(dp(30));
        if (primary) g.setColor(Color.parseColor("#F2C766")); else { g.setColor(0x22FFFFFF); g.setStroke(dp(1.5f), 0x88FFFFFF); }
        b.setBackground(g); b.setPadding(dp(16), dp(14), dp(16), dp(14)); b.setOnClickListener(on);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2); lp.topMargin = dp(10); b.setLayoutParams(lp); return b;
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        current = new WeakReference<>(this);
        if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true); }
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        w.setStatusBarColor(Color.TRANSPARENT);
        w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);

        String k = AdhanService.key;
        String[] c = SKY[4];
        for (String[] s : SKY) if (s[0].equals(k)) c = s;
        FrameLayout root = new FrameLayout(this);
        root.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{Color.parseColor(c[1]), Color.parseColor(c[2]), Color.parseColor(c[3])}));
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        LinearLayout col = new LinearLayout(this); col.setOrientation(LinearLayout.VERTICAL); col.setGravity(Gravity.CENTER_HORIZONTAL);
        col.setPadding(dp(28), dp(56), dp(28), dp(36));
        col.addView(tv("الرفيق", 15, 0xCCF2C766, true));
        TextView icon = tv("🕌", 64, Color.WHITE, false); icon.setPadding(0, dp(18), 0, dp(6)); col.addView(icon);
        col.addView(tv("حان الآن موعد أذان", 20, 0xEEFFFFFF, false));
        col.addView(tv(AdhanService.name.isEmpty() ? "الصلاة" : AdhanService.name, 48, Color.parseColor("#F7D37A"), true));
        if (!AdhanService.time.isEmpty()) col.addView(tv(AdhanService.time, 18, 0xCCFFFFFF, false));

        LinearLayout card = new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL); card.setGravity(Gravity.CENTER);
        GradientDrawable cg = new GradientDrawable(); cg.setCornerRadius(dp(24)); cg.setColor(0x33000000); cg.setStroke(dp(1), 0x33FFFFFF);
        card.setBackground(cg); card.setPadding(dp(18), dp(22), dp(18), dp(22));
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(-1, -2); clp.topMargin = dp(26); card.setLayoutParams(clp);
        label = tv("", 13, 0xCCF2C766, true); card.addView(label);
        phrase = tv(T, 30, Color.WHITE, true); phrase.setPadding(0, dp(6), 0, dp(6)); card.addView(phrase);
        reply = tv("", 15, 0xBBFFFFFF, false); card.addView(reply);
        col.addView(card);

        View space = new View(this); col.addView(space, new LinearLayout.LayoutParams(1, 0, 1f));
        col.addView(tv("بصوت الشيخ نصر الدين طوبار", 13, 0x99FFFFFF, false));
        col.addView(button("إيقاف الأذان", true, v -> stopAdhan()));
        col.addView(button("فتح الرفيق", false, v -> openApp()));
        root.addView(col, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        h.post(tick);
    }

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if ("dua".equals(AdhanService.phase)) {
                if (last != 99) { last = 99; label.setText("دعاء ما بعد الأذان"); phrase.setText(DUA); phrase.setTextSize(21); reply.setText("«حلّت له شفاعتي يوم القيامة» — رواه البخاري"); }
            } else {
                int pos = AdhanService.position();
                double s = pos >= 0 ? pos / 1000.0 : -1;
                double[] cues = "fajr".equals(AdhanService.key) ? CF : CA;
                int i = 0; if (s >= 0) for (int k = 0; k < cues.length; k++) if (s >= cues[k]) i = k;
                if (i != last) {
                    last = i; label.setText(s >= 0 ? "يُرفع الآن" : "حيّ على الصلاة");
                    phrase.setText(TX[i]); phrase.setAlpha(0f); phrase.animate().alpha(1f).setDuration(500).start();
                    reply.setText("ردّد: " + (TX[i].equals(HS) || TX[i].equals(HF) ? HAWQ : TX[i]));
                }
            }
            h.postDelayed(this, 300);
        }
    };

    private void stopAdhan() {
        try { startService(new Intent(this, AdhanService.class).setAction(AdhanService.ACTION_STOP)); } catch (Exception ignored) {}
        try { getSystemService(NotificationManager.class).cancel(AdhanService.NID); } catch (Exception ignored) {}
        finishAndRemoveTask();
    }

    private void openApp() {
        Intent i = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP).setData(android.net.Uri.parse("alrafiq://open/prayer"));
        KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && km != null && km.isKeyguardLocked()) {
            km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override public void onDismissSucceeded() { startActivity(i); finishAndRemoveTask(); }
            });
        } else { startActivity(i); finishAndRemoveTask(); }
    }

    // الشاشة ثابتة: زرار الرجوع ما بيقفلهاش، الإيقاف من الزرار
    @Override public void onBackPressed() { }

    @Override protected void onDestroy() { h.removeCallbacksAndMessages(null); if (current.get() == this) current.clear(); super.onDestroy(); }
}
