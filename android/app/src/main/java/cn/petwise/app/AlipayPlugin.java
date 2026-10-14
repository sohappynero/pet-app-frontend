package cn.petwise.app;

import com.alipay.sdk.app.PayTask;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Map;

/**
 * 支付宝 APP 支付薄桥接。
 *
 * 只做一件事：把后端签好的 orderString 交给支付宝 SDK 调起，并把 SDK 的原始结果原样回给 JS。
 * 不在原生侧判断支付是否成功——会员开通只认服务端订单状态，resultStatus 仅用于决定前端 UI。
 */
@CapacitorPlugin(name = "Alipay")
public class AlipayPlugin extends Plugin {

    @PluginMethod
    public void pay(PluginCall call) {
        String orderString = call.getString("orderString");
        if (orderString == null || orderString.trim().isEmpty()) {
            call.reject("orderString 为空，无法调起支付");
            return;
        }

        // PayTask.payV2 是阻塞调用，必须在非 UI 线程执行，否则会卡死 WebView
        new Thread(() -> {
            try {
                PayTask payTask = new PayTask(getActivity());
                // 第二个参数 true：由 SDK 在调起过程中展示 loading
                Map<String, String> result = payTask.payV2(orderString, true);

                JSObject ret = new JSObject();
                ret.put("resultStatus", result.get("resultStatus"));
                ret.put("result", result.get("result"));
                ret.put("memo", result.get("memo"));
                call.resolve(ret);
            } catch (Throwable e) {
                // 包括 SDK 未正确集成时的 NoClassDefFoundError
                call.reject("调起支付宝失败: " + e.getMessage(), e);
            }
        }).start();
    }
}
