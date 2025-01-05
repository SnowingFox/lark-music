// node-sdk使用说明：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/nodejs-sdk/preparation-before-development
// 以下示例代码默认根据文档示例值填充，如果存在代码问题，请在 API 调试台填上相关必要参数后再复制代码使用
// eslint-disable-next-line @typescript-eslint/no-require-imports
const lark = require("@larksuiteoapi/node-sdk");

// 开发者复制该Demo后，需要修改Demo里面的"app id", "app secret"为自己应用的appId, appSecret
const client = new lark.Client({
  appId: "app id",
  appSecret: "app secret",
  // disableTokenCache为true时，SDK不会主动拉取并缓存token，这时需要在发起请求时，调用lark.withTenantToken("token")手动传递
  // disableTokenCache为false时，SDK会自动管理租户token的获取与刷新，无需使用lark.withTenantToken("token")手动传递token
  disableTokenCache: true,
});

export const sendMessage = async (receive_id: string, content: string) => {
  client.im.message.create(
    {
      params: {
        receive_id_type: "union_id",
      },
      data: {
        receive_id,
        msg_type: "text",
        content: `{"text":"${content}"}`,
      },
    },
    lark.withTenantToken(process.env.LARK_BOT_TOKEN)
  );
};
