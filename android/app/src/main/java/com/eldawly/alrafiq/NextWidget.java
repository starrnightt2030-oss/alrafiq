package com.eldawly.alrafiq;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** ويدجت صغيرة (٢×٢): الصلاة القادمة + العدّاد + الأذكار */
public class NextWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        RafiqWidgets.updateAll(c);
    }
}
