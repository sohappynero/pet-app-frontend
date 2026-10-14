package cn.petwise.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 本地插件不会被 Capacitor 自动发现，必须在 super.onCreate 之前手动注册
        registerPlugin(AlipayPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
