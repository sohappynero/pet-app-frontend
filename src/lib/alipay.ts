/**
 * 支付宝 APP 支付桥接
 *
 * 原生侧由 android/app/src/main/java/cn/petwise/app/AlipayPlugin.java 实现，
 * 只负责调起 SDK 并原样回传 SDK 结果；是否开通会员一律以服务端订单状态为准，
 * 这里的 resultStatus 仅用于决定前端 UI（见 pollOrderPaid）。
 */
import { registerPlugin, Capacitor } from "@capacitor/core";

/** 支付宝 SDK 回调的原始结果 */
export interface AlipayResult {
  /** 9000 成功 / 8000 处理中 / 6001 用户取消 / 6002 网络异常 / 4000 失败 */
  resultStatus: string;
  /** 已签名的同步返回报文，前端不解析也不信任 */
  result?: string;
  /** SDK 提示文案 */
  memo?: string;
}

export interface AlipayPlugin {
  pay(options: { orderString: string }): Promise<AlipayResult>;
}

/** 支付宝 SDK resultStatus 取值（仅列用得到的） */
export const ALIPAY_STATUS = {
  /** 支付成功（仍需服务端确认） */
  SUCCESS: "9000",
  /** 正在处理中，结果未知，需查服务端 */
  PROCESSING: "8000",
  /** 用户中途取消，按静默处理不报错 */
  CANCELED: "6001",
  /** 网络连接出错 */
  NETWORK_ERROR: "6002",
  /** 订单支付失败 */
  FAILED: "4000",
} as const;

/** Web 环境下的占位实现：APP 支付的 order_string 无法在浏览器中调起 */
const webFallback: AlipayPlugin = {
  async pay() {
    // 不伪造成功态，返回失败让 UI 明确提示去 App 内支付
    return {
      resultStatus: ALIPAY_STATUS.FAILED,
      memo: "当前环境不支持支付宝支付，请在 App 内完成支付",
    };
  },
};

const Alipay = registerPlugin<AlipayPlugin>("Alipay", { web: webFallback });

/** 当前环境是否具备调起支付宝的能力（仅原生 App） */
export function canPayWithAlipay(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * 调起支付宝支付。
 * @param orderString 后端 /create-order 返回的已签名参数串
 * @returns SDK 原始结果；调起过程本身异常时抛错
 */
export function payWithAlipay(orderString: string): Promise<AlipayResult> {
  return Alipay.pay({ orderString });
}
