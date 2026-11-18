package com.eldawly.alrafiq;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

/** جسر بين التطبيق والويدجت: يحفظ بيانات العرض ويسحب عدّ المسبحة */
@CapacitorPlugin(name = "RafiqWidget")
public class WidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        String json = call.getString("json", "{}");
        RafiqWidgets.prefs(getContext()).edit().putString("data", json).apply();
        RafiqWidgets.updateAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void drain(PluginCall call) {
        synchronized (TasbihWidget.class) {
            String p = RafiqWidgets.prefs(getContext()).getString("pending", "{}");
            RafiqWidgets.prefs(getContext()).edit().putString("pending", new JSONObject().toString()).apply();
            JSObject r = new JSObject();
            r.put("json", p);
            call.resolve(r);
        }
    }
}
