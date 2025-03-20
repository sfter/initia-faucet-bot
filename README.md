# initia-faucet-bot

## 项目简介
这是一个基于Node.js的自动化工具，用于与Initia区块链交互。该工具支持使用多钱包/多代理IP和验证码服务，以提高操作效率和成功率。

## 环境要求
- Node.js (建议v14.0.0或更高版本)
- npm / yarn / pnpm

## 安装步骤
1. 克隆仓库到本地
```bash
git clone https://github.com/你的用户名/项目名称.git
cd 项目名称
```

2. 安装依赖
```bash
npm install
```

## 配置说明
在开始使用前，您需要配置以下文件：

### 1. Proxy.txt
在此文件中填入代理IP地址，每行一个，格式如下：
```
http/sock5://ip:端口:用户名:密码
```
例如：
```
http/sock5://192.168.1.1:8080:user:pass
http/sock5://192.168.1.2:8080:user:pass
```

### 2. wallet.txt
在此文件中填入您的Initia钱包地址，每行一个地址。例如：
```
initia1xyzabcdefghijklmnopqrstuvwxyz123456
initia1abcdefghijklmnopqrstuvwxyz123456xyz
```

### 3. bot.js（或.env）
添加您的YesCaptcha API密钥：
需要购买：https://yescaptcha.com/i/fzK6Vu

## 使用方法
配置完成后，运行以下命令启动程序：

```bash
npm start
```
或
```bash
node index.js
```

## 高级设置
您可以通过修改配置文件调整程序的参数，如：
- 任务间隔时间
- 重试次数
- 日志级别
- 等等

## 常见问题

### 1. 代理IP无法连接
- 检查IP格式是否正确
- 确认代理服务器是否在线
- 验证用户名和密码是否正确

### 2. YesCaptcha解析失败
- 检查API密钥是否有效
- 确认账户余额是否充足
- 网络连接是否稳定

### 3. Initia钱包地址报错
- 确认地址格式是否正确
- 检查钱包是否已激活

## 贡献指南
欢迎提交问题和拉取请求，共同改进这个项目。

## 许可证
[MIT](LICENSE)

---

如需更多帮助或有任何问题，请在GitHub Issues中提出。
