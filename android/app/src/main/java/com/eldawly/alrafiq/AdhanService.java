package com.eldawly.alrafiq;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

/** خدمة الأذان: تشغّل الأذان كاملًا (ثم الدعاء) وتعرض شاشة الأذان فوق القفل حتى ينتهي */
public class AdhanService extends Service {
    static final String CH = "adhan_screen", ACTION_STOP = "com.eldawly.alrafiq.ADHAN_STOP";
    static final int NID = 4242;
    // حالة عامة تقرأها شاشة الأذان
    static volatile boolean running = false;
    static volatile String key = "", name = "", time = "", phase = "adhan";
    static volatile long startedAt = 0;
    static MediaPlayer player;

    private final Handler h = new Handler(Looper.getMainLooper());
    private AudioManager am;
    private AudioFocusRequest focus;

    @Override public IBinder onBind(Intent i) { return null; }

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CH) != null) return;
        NotificationChannel ch = new NotificationChannel(CH, "شاشة الأذان", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("تظهر شاشة الأذان على الشاشة حتى لو الموبايل مقفول");
        ch.setSound(null, null); // الصوت تشغّله الخدمة نفسها
        ch.enableVibration(true);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        ch.setBypassDnd(false);
        nm.createNotificationChannel(ch);
    }

    static PendingIntent screenIntent(Context c) {
        Intent i = new Intent(c, AdhanActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        return PendingIntent.getActivity(c, 4243, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static Notification build(Context c, String nm, boolean withStop) {
        ensureChannel(c);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CH) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat_rafiq)
                .setColor(0xFFD9B55A)
                .setContentTitle("حان الآن موعد أذان " + nm)
                .setContentText("حيّ على الصلاة، حيّ على الفلاح — الرفيق")
                .setCategory(Notification.CATEGORY_ALARM)
                .setPriority(Notification.PRIORITY_MAX)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(screenIntent(c))
                .setFullScreenIntent(screenIntent(c), true);
        if (withStop) {
            PendingIntent stop = PendingIntent.getService(c, 4244, new Intent(c, AdhanService.class).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE);
            b.addAction(new Notification.Action.Builder(null, "إيقاف الأذان", stop).build());
        }
        return b.build();
    }

    /** احتياطي لو مُنع تشغيل الخدمة: إشعار ملء الشاشة فقط */
    static void postFallback(Context c, String k, String nm, String t) {
        key = k == null ? "" : k; name = nm == null ? "" : nm; time = t == null ? "" : t;
        try { c.getSystemService(NotificationManager.class).notify(NID, build(c, name, false)); } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent in, int flags, int startId) {
        if (in != null && ACTION_STOP.equals(in.getAction())) { finishAll(); return START_NOT_STICKY; }
        String k = in != null ? in.getStringExtra(AdhanAlarms.EXTRA_KEY) : null;
        key = k == null ? "dhuhr" : k;
        String nm = in != null ? in.getStringExtra(AdhanAlarms.EXTRA_NAME) : null;
        name = nm == null ? "" : nm;
        String t = in != null ? in.getStringExtra(AdhanAlarms.EXTRA_TIME) : null;
        time = t == null ? "" : t;
        Notification n = build(this, name, true);
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(NID, n);
        } catch (Exception e) { postFallback(this, key, name, time); stopSelf(); return START_NOT_STICKY; }
        running = true; startedAt = System.currentTimeMillis(); phase = "adhan";
        // لو التطبيق مفتوح قدامك: نفتح شاشة الأذان مباشرة
        if (MainActivity.visible) { try { startActivity(new Intent(this, AdhanActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Exception ignored) {} }
        play(key.equals("fajr") ? R.raw.fajr : R.raw.adhan);
        h.postDelayed(this::finishAll, 9 * 60 * 1000); // أمان: لا تستمر أكثر من ٩ دقائق
        return START_NOT_STICKY;
    }

    private void play(int res) {
        releasePlayer();
        am = (AudioManager) getSystemService(AUDIO_SERVICE);
        int mode = am.getRingerMode();
        float vol = AdhanAlarms.prefs(this).getFloat("volume", 1f);
        if (mode != AudioManager.RINGER_MODE_NORMAL) {
            // الموبايل صامت أو هزّاز: نهزّ ونعرض الشاشة بدون صوت
            vibrate();
            h.postDelayed(this::finishAll, 60 * 1000);
            return;
        }
        AudioAttributes aa = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build();
        if (Build.VERSION.SDK_INT >= 26) {
            focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT).setAudioAttributes(aa).setOnAudioFocusChangeListener(f -> {}).build();
            am.requestAudioFocus(focus);
        }
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(aa);
            player.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            player.setDataSource(this, Uri.parse("android.resource://" + getPackageName() + "/" + res));
            player.setVolume(vol, vol);
            player.setOnCompletionListener(mp -> {
                if ("adhan".equals(phase) && AdhanAlarms.prefs(this).getBoolean("dua", true)) { phase = "dua"; play(R.raw.dua); }
                else finishAll();
            });
            player.setOnErrorListener((mp, w, x) -> { finishAll(); return true; });
            player.prepare();
            player.start();
        } catch (Exception e) { vibrate(); h.postDelayed(this::finishAll, 60 * 1000); }
    }

    private void vibrate() {
        try {
            Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            long[] p = {0, 600, 400, 600, 400, 900};
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(p, -1)); else v.vibrate(p, -1);
        } catch (Exception ignored) {}
    }

    static int position() { try { return player != null && player.isPlaying() ? player.getCurrentPosition() : -1; } catch (Exception e) { return -1; } }

    private static void releasePlayer() {
        if (player != null) { try { player.stop(); } catch (Exception ignored) {} player.release(); player = null; }
    }

    private void finishAll() {
        h.removeCallbacksAndMessages(null);
        releasePlayer();
        if (am != null && focus != null && Build.VERSION.SDK_INT >= 26) am.abandonAudioFocusRequest(focus);
        running = false;
        AdhanActivity.closeAll();
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE); else stopForeground(true);
        stopSelf();
    }

    @Override public void onDestroy() { releasePlayer(); running = false; super.onDestroy(); }
}
