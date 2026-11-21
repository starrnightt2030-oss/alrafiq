package com.eldawly.alrafiq;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
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
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ImageView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.content.res.ResourcesCompat;

import java.io.InputStream;
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
    private LinearLayout dots;
    private int last = -2;
    private Typeface amiri, ruqaa;
    static final int GOLD = 0xFFF5CF73;

    private int dp(float v) { return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()); }
    private TextView tv(String s, float sp, int color, Typeface f) {
        TextView t = new TextView(this); t.setText(s); t.setTextSize(sp); t.setTextColor(color); t.setGravity(Gravity.CENTER);
        t.setTypeface(f != null ? f : Typeface.DEFAULT); t.setLineSpacing(0, 1.2f); t.setShadowLayer(dp(6), 0, dp(1.5f), 0xAA000000); return t;
    }
    private TextView button(String s, boolean primary, View.OnClickListener on) {
        TextView b = tv(s, 17, primary ? 0xFF2A1C05 : Color.WHITE, Typeface.DEFAULT_BOLD);
        b.setShadowLayer(0, 0, 0, 0);
        GradientDrawable g;
        if (primary) { g = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, new int[]{0xFFE9B850, 0xFFF9DC8C, 0xFFE9B850}); }
        else { g = new GradientDrawable(); g.setColor(0x2EFFFFFF); g.setStroke(dp(1.2f), 0x80FFFFFF); }
        g.setCornerRadius(dp(30));
        b.setBackground(g); b.setPadding(dp(16), dp(14), dp(16), dp(14)); b.setOnClickListener(on);
        if (Build.VERSION.SDK_INT >= 21 && primary) b.setElevation(dp(6));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2); lp.topMargin = dp(10); b.setLayoutParams(lp); return b;
    }
    private Typeface font(int res) { try { return ResourcesCompat.getFont(this, res); } catch (Exception e) { return Typeface.SERIF; } }

    /** خلفية الصلاة: صورتين لكل صلاة بالتبادل يوم بيوم (نفس صور شاشة الأذان في التطبيق) */
    static String bgName(String k) {
        String key = k == null || k.isEmpty() ? "isha" : k;
        int day = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_YEAR);
        return key + (day % 2 == 0 ? "1" : "2");
    }
    private Bitmap loadBg(String k) {
        for (String n : new String[]{bgName(k), (k == null || k.isEmpty() ? "isha" : k) + "1", "isha1"}) {
            try (InputStream in = getAssets().open("public/img/adhan/" + n + ".webp")) { Bitmap b = BitmapFactory.decodeStream(in); if (b != null) return b; } catch (Exception ignored) {}
        }
        return null;
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        current = new WeakReference<>(this);
        if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true); }
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        w.setStatusBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 21) w.setNavigationBarColor(Color.TRANSPARENT);
        w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        amiri = font(R.font.amiri_bold); ruqaa = font(R.font.ruqaa_bold);

        String k = AdhanService.key;
        String[] c = SKY[4];
        for (String[] s : SKY) if (s[0].equals(k)) c = s;
        FrameLayout root = new FrameLayout(this);
        root.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{Color.parseColor(c[1]), Color.parseColor(c[2]), Color.parseColor(c[3])}));
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        // الصورة بملء الشاشة مع حركة تقريب هادية
        Bitmap bg = loadBg(k);
        if (bg != null) {
            ImageView img = new ImageView(this); img.setScaleType(ImageView.ScaleType.CENTER_CROP); img.setImageBitmap(bg);
            root.addView(img, new FrameLayout.LayoutParams(-1, -1));
            img.setAlpha(0f); img.animate().alpha(1f).setDuration(900).start();
            ObjectAnimator zx = ObjectAnimator.ofFloat(img, "scaleX", 1f, 1.1f), zy = ObjectAnimator.ofFloat(img, "scaleY", 1f, 1.1f);
            for (ObjectAnimator a : new ObjectAnimator[]{zx, zy}) { a.setDuration(26000); a.setRepeatMode(ValueAnimator.REVERSE); a.setRepeatCount(ValueAnimator.INFINITE); a.setInterpolator(new AccelerateDecelerateInterpolator()); a.start(); }
        }
        // تظليل فوق وتحت عشان الكلام يبان واضح على أي صورة
        View shade = new View(this);
        shade.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{0xCC000000, 0x40000000, 0x26000000, 0x59000000, 0xE6000000}));
        root.addView(shade, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout col = new LinearLayout(this); col.setOrientation(LinearLayout.VERTICAL); col.setGravity(Gravity.CENTER_HORIZONTAL);
        col.setPadding(dp(26), dp(52), dp(26), dp(34));

        TextView brand = tv("✦  الرفيق  ✦", 13, 0xDDF5CF73, Typeface.DEFAULT_BOLD); brand.setLetterSpacing(0.15f); col.addView(brand);
        TextView sub = tv("حان الآن موعد أذان", 19, 0xF2FFFFFF, Typeface.DEFAULT); sub.setPadding(0, dp(14), 0, 0); col.addView(sub);
        TextView title = tv(AdhanService.name.isEmpty() ? "الصلاة" : AdhanService.name, 60, GOLD, ruqaa);
        title.setShadowLayer(dp(16), 0, 0, 0xCCE0A43A); title.setIncludeFontPadding(false); title.setPadding(0, dp(4), 0, dp(6));
        col.addView(title);
        title.setScaleX(.85f); title.setScaleY(.85f); title.setAlpha(0f); title.animate().scaleX(1f).scaleY(1f).alpha(1f).setStartDelay(300).setDuration(900).start();
        if (!AdhanService.time.isEmpty()) {
            TextView t = tv("🕰  " + AdhanService.time, 15, Color.WHITE, Typeface.DEFAULT_BOLD); t.setShadowLayer(0, 0, 0, 0);
            GradientDrawable pg = new GradientDrawable(); pg.setCornerRadius(dp(20)); pg.setColor(0x40000000); pg.setStroke(dp(1), 0x66F5CF73);
            t.setBackground(pg); t.setPadding(dp(18), dp(6), dp(18), dp(6));
            LinearLayout.LayoutParams tl = new LinearLayout.LayoutParams(-2, -2); tl.gravity = Gravity.CENTER_HORIZONTAL; col.addView(t, tl);
        }

        View sp1 = new View(this); col.addView(sp1, new LinearLayout.LayoutParams(1, 0, 1f));

        // بطاقة زجاجية فيها جملة الأذان الحالية
        LinearLayout card = new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL); card.setGravity(Gravity.CENTER);
        GradientDrawable cg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{0x8C08121E, 0xB305090F});
        cg.setCornerRadius(dp(28)); cg.setStroke(dp(1.2f), 0x73F5CF73);
        card.setBackground(cg); card.setPadding(dp(18), dp(20), dp(18), dp(18));
        label = tv("", 13, GOLD, Typeface.DEFAULT_BOLD); label.setShadowLayer(0, 0, 0, 0); card.addView(label);
        TextView orn = tv("۞", 14, 0x99F5CF73, null); orn.setShadowLayer(0, 0, 0, 0); card.addView(orn);
        phrase = tv(T, 32, Color.WHITE, amiri); phrase.setShadowLayer(dp(14), 0, 0, 0xB3F5CF73); phrase.setPadding(0, dp(2), 0, dp(8)); card.addView(phrase);
        reply = tv("", 14, 0xDDFFFFFF, Typeface.DEFAULT); reply.setShadowLayer(0, 0, 0, 0);
        GradientDrawable rg = new GradientDrawable(); rg.setCornerRadius(dp(16)); rg.setColor(0x26FFFFFF); reply.setBackground(rg); reply.setPadding(dp(14), dp(6), dp(14), dp(6));
        card.addView(reply, new LinearLayout.LayoutParams(-2, -2));
        dots = new LinearLayout(this); dots.setOrientation(LinearLayout.HORIZONTAL); dots.setGravity(Gravity.CENTER);
        for (int i = 0; i < TX.length; i++) { View d = new View(this); LinearLayout.LayoutParams dl = new LinearLayout.LayoutParams(dp(7), dp(7)); dl.leftMargin = dl.rightMargin = dp(3); dots.addView(d, dl); }
        LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(-2, -2); dlp.topMargin = dp(14); card.addView(dots, dlp);
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(-1, -2); card.setLayoutParams(clp);
        col.addView(card);
        card.setTranslationY(dp(30)); card.setAlpha(0f); card.animate().translationY(0).alpha(1f).setStartDelay(600).setDuration(800).start();

        View sp2 = new View(this); col.addView(sp2, new LinearLayout.LayoutParams(1, 0, .6f));
        col.addView(tv("بصوت الشيخ نصر الدين طوبار", 13, 0xB3FFFFFF, Typeface.DEFAULT));
        col.addView(button("إيقاف الأذان", true, v -> stopAdhan()));
        col.addView(button("فتح الرفيق", false, v -> openApp()));
        root.addView(col, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        h.post(tick);
    }

    private void paintDots(int now) {
        for (int i = 0; i < dots.getChildCount(); i++) {
            GradientDrawable g = new GradientDrawable(); g.setShape(GradientDrawable.OVAL);
            g.setColor(now < 0 ? 0x4DFFFFFF : i < now ? GOLD : i == now ? Color.WHITE : 0x4DFFFFFF);
            View d = dots.getChildAt(i); d.setBackground(g); float sc = i == now ? 1.5f : 1f; d.setScaleX(sc); d.setScaleY(sc);
        }
    }

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if ("dua".equals(AdhanService.phase)) {
                if (last != 99) {
                    last = 99; label.setText("دعاء ما بعد الأذان"); phrase.setText(DUA); phrase.setTextSize(22);
                    reply.setText("«حلّت له شفاعتي يوم القيامة» — رواه البخاري"); dots.setVisibility(View.GONE);
                    phrase.setAlpha(0f); phrase.animate().alpha(1f).setDuration(700).start();
                }
            } else {
                int pos = AdhanService.position();
                double s = pos >= 0 ? pos / 1000.0 : -1;
                double[] cues = "fajr".equals(AdhanService.key) ? CF : CA;
                int i = 0; if (s >= 0) for (int k = 0; k < cues.length; k++) if (s >= cues[k]) i = k;
                if (i != last) {
                    last = i; label.setText(s >= 0 ? "يُرفع الآن" : "حيّ على الصلاة");
                    phrase.setText(TX[i]); phrase.setAlpha(0f); phrase.setTranslationY(dp(14));
                    phrase.animate().alpha(1f).translationY(0).setDuration(650).start();
                    reply.setText("ردّد: " + (TX[i].equals(HS) || TX[i].equals(HF) ? HAWQ : TX[i]));
                    paintDots(s >= 0 ? i : -1);
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
