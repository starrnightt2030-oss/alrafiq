package com.eldawly.alrafiq;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** يعيد جدولة الأذان بعد إعادة تشغيل الموبايل أو تحديث التطبيق أو تغيير الوقت */
public class AdhanBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent in) { AdhanAlarms.scheduleAll(c); }
}
