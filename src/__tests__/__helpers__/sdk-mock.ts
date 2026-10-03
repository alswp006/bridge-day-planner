import { vi } from "vitest";

// @apps-in-toss/web-framework 목의 본문. 실제 SDK export 모양(.d.ts 검증)을 따른다.
// vitest.setup.ts가 vi.mock으로 **먼저** 등록한다 — 테스트 파일이 SDK를 import한 *뒤에*
// (헬퍼 안의 vi.mock이 끌어올려져 등록되는 시점) 목이 걸리면, 테스트가 쥔 `generateHapticFeedback`은
// 진짜 SDK 함수라 `expect(...).toHaveBeenCalledWith`가 "is not a spy"로 죽는다.
export function createSdkMock() {
  const Storage = {
    setItem: vi.fn(async (k: string, v: string) => { localStorage.setItem(k, v); }),
    getItem: vi.fn(async (k: string) => localStorage.getItem(k)),
    removeItem: vi.fn(async (k: string) => { localStorage.removeItem(k); }),
    clearItems: vi.fn(async () => { localStorage.clear(); }),
  };

  const Analytics = {
    screen: vi.fn(async () => {}),
    impression: vi.fn(async () => {}),
    click: vi.fn(async () => {}),
  };

  // Imperative ad API — auto-fires onEvent so tests don't hang
  const loadFullScreenAd = vi.fn((opts: { onEvent?: (e: any) => void; onError?: (e: any) => void }) => {
    setTimeout(() => opts.onEvent?.({ type: "loaded" }), 0);
  });
  const showFullScreenAd = vi.fn((opts: { onEvent?: (e: any) => void; onError?: (e: any) => void }) => {
    setTimeout(() => opts.onEvent?.({ type: "rewarded" }), 0);
  });
  // TossAds banner API (real SDK exports — see @apps-in-toss/web-bridge .d.ts)
  const TossAds = {
    initialize: Object.assign(vi.fn(), { isSupported: () => true }),
    attachBanner: Object.assign(
      vi.fn(() => ({ destroy: vi.fn() })),
      { isSupported: () => true },
    ),
    attach: Object.assign(vi.fn(), { isSupported: () => true }),
    destroy: Object.assign(vi.fn(), { isSupported: () => true }),
    destroyAll: Object.assign(vi.fn(), { isSupported: () => true }),
  };

  // IAP
  const createOneTimePurchaseOrder = vi.fn((opts: any) => {
    setTimeout(async () => {
      const granted = await opts.options.processProductGrant({ orderId: "test-order-1" });
      if (granted) {
        opts.onEvent?.({
          type: "success",
          data: {
            orderId: "test-order-1",
            displayName: "Test Product",
            displayAmount: "1,000원",
            amount: 1000,
            currency: "KRW",
            fraction: 0,
            miniAppIconUrl: null,
          },
        });
      }
    }, 0);
  });
  const createSubscriptionPurchaseOrder = vi.fn((opts: any) => {
    setTimeout(async () => {
      const granted = await opts.options.processProductGrant({
        orderId: "test-sub-1",
        subscriptionId: "test-sub",
      });
      if (granted) {
        opts.onEvent?.({
          type: "success",
          data: {
            orderId: "test-sub-1",
            displayName: "Test Subscription",
            displayAmount: "4,900원/월",
            amount: 4900,
            currency: "KRW",
            fraction: 0,
            miniAppIconUrl: null,
          },
        });
      }
    }, 0);
  });

  return {
    Storage,
    Analytics,

    generateHapticFeedback: vi.fn(),
    grantPromotionReward: vi.fn(async () => {}),
    getIsTossLoginIntegratedService: vi.fn(async () => false),

    loadFullScreenAd,
    showFullScreenAd,
    TossAds,

    // IAP 실제 API는 IAP 네임스페이스 아래에 있다(.d.ts 검증). 각 메서드는 cleanup 함수 반환.
    // (최상위 이름은 하위호환용으로 유지 — 실제 SDK 최상위 export 아님)
    createOneTimePurchaseOrder,
    createSubscriptionPurchaseOrder,
    IAP: {
      createOneTimePurchaseOrder: vi.fn((opts: any) => {
        createOneTimePurchaseOrder(opts);
        return () => {};
      }),
      createSubscriptionPurchaseOrder: vi.fn((opts: any) => {
        createSubscriptionPurchaseOrder(opts);
        return () => {};
      }),
    },

    // Misc bridge
    share: vi.fn(async () => {}),
    // 토스 인앱 딥링크 생성. devtools mock이 주는 형식(`https://toss.im/share/mock<path>`)을
    // 그대로 흉내낸다 — 심이 벤더의 *모양*과 어긋나면 앱이 아니라 심이 거짓말한다.
    getTossShareLink: vi.fn(async (path: string, _ogImageUrl?: string) => `https://toss.im/share/mock${path}`),
    setClipboardText: vi.fn(async () => {}),
    getClipboardText: vi.fn(async () => ""),
    requestReview: vi.fn(async () => {}),
    openURL: vi.fn(async () => {}),
    getPlatformOS: vi.fn(async () => "ios"),
    getNetworkStatus: vi.fn(async () => ({ connected: true, type: "wifi" })),
    getTossAppVersion: vi.fn(async () => "5.0.0"),
    getOperationalEnvironment: vi.fn(async () => "development"),
    getPermission: vi.fn(async () => ({ granted: true })),
    getSchemeUri: vi.fn(async () => "intoss://test-app"),
  };
}
