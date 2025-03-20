const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const Captcha = require('yescaptcha');
const path = require('path');
const { showBanner } = require('./banner');
const logger = require('./logger');

// 显示启动Banner
showBanner();

// 配置
const CLIENT_KEY = ""; // 替换为您的YesCaptcha客户端密钥
const SITEKEY = "0x4AAAAAAA47SsoQAdSW6HIy"; // 水龙头的 Turnstile site key
const FAUCET_URL = "https://faucet-api.testnet.initia.xyz/claim"; // 水龙头 API 地址
const WALLET_FILE = "wallet.txt"; // 钱包地址文件
const PROXY_FILE = "proxy.txt"; // 代理文件
const WAIT_TIME = 8 * 60 * 60 * 1000 + 3 * 60 * 1000; // 8小时3分钟，单位毫秒

// 数据存储路径
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}
const CLAIM_HISTORY_FILE = path.join(DATA_DIR, 'claim_history.json');

// 加载或初始化索赔历史
function loadClaimHistory() {
    try {
        if (fs.existsSync(CLAIM_HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(CLAIM_HISTORY_FILE, 'utf-8'));
        }
    } catch (error) {
        logger.error(`加载历史记录失败: ${error.message}`);
    }
    return {};
}

// 保存索赔历史
function saveClaimHistory(history) {
    try {
        fs.writeFileSync(CLAIM_HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
        logger.error(`保存历史记录失败: ${error.message}`);
    }
}

// 加载钱包地址
function loadWallets(filePath) {
    if (!fs.existsSync(filePath)) {
        logger.error(`钱包文件不存在: ${filePath}`);
        process.exit(1);
    }
    const wallets = fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
    logger.info(`已加载 ${wallets.length} 个钱包地址`);
    return wallets;
}

// 加载代理列表
function loadProxies(filePath) {
    if (!fs.existsSync(filePath)) {
        logger.error(`代理文件不存在: ${filePath}`);
        process.exit(1);
    }
    const proxies = fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
    logger.info(`已加载 ${proxies.length} 个代理`);
    return proxies;
}

// 格式化代理URL
function formatProxyUrl(proxyStr) {
    logger.debug(`尝试解析代理: ${proxyStr}`);
    if (!proxyStr) return null;
    
    try {
        // 检查代理字符串是否已经是有效URL格式
        new URL(proxyStr);
        logger.debug(`代理格式有效: ${proxyStr}`);
        return proxyStr;
    } catch (e) {
        logger.debug(`代理格式无效，尝试重新格式化`);
        // 不是有效URL，尝试解析格式
        // 假设格式可能是: protocol://host:port:username:password 或 host:port:username:password
        const parts = proxyStr.split(':');
        
        if (parts.length >= 2) {
            let protocol, host, port, username, password;
            
            // 处理不同格式
            if (proxyStr.includes('://')) {
                // 包含协议
                const protocolParts = parts[0].split('://');
                protocol = protocolParts[0];
                host = protocolParts[1];
                port = parts[1];
                username = parts.length > 2 ? parts[2] : '';
                password = parts.length > 3 ? parts[3] : '';
                logger.debug(`解析为: 协议=${protocol}, 主机=${host}, 端口=${port}, 用户=${username}, 密码=${password ? '已设置' : '未设置'}`);
            } else {
                // 不包含协议，默认使用http
                protocol = 'http';
                host = parts[0];
                port = parts[1];
                username = parts.length > 2 ? parts[2] : '';
                password = parts.length > 3 ? parts[3] : '';
                logger.debug(`使用默认协议http: 主机=${host}, 端口=${port}, 用户=${username}, 密码=${password ? '已设置' : '未设置'}`);
            }
            
            // 构建代理URL
            let formattedUrl;
            if (username && password) {
                formattedUrl = `${protocol}://${username}:${password}@${host}:${port}`;
            } else {
                formattedUrl = `${protocol}://${host}:${port}`;
            }
            
            logger.debug(`格式化后的代理URL: ${formattedUrl}`);
            return formattedUrl;
        }
    }
    
    // 如果无法解析，返回null
    logger.warn(`⚠️ 无法解析代理格式: ${proxyStr}`);
    return null;
}

// 使用 YesCaptcha 解决 Turnstile 验证码
async function solveCaptcha(proxy) {
    logger.info("⏳ 等待 CAPTCHA 完成...");
    try {
        // 创建基本axios调用来使用YesCaptcha API
        const response = await axios.post('https://api.yescaptcha.com/createTask', {
            clientKey: CLIENT_KEY,
            task: {
                type: 'TurnstileTaskProxyless',
                websiteURL: 'https://app.testnet.initia.xyz',
                websiteKey: SITEKEY
            }
        });
        
        if (response.data.errorId !== 0) {
            throw new Error(`YesCaptcha API错误: ${response.data.errorDescription}`);
        }
        
        logger.success(`✅ 创建任务成功，任务ID: ${response.data.taskId}`);
        
        // 轮询获取结果
        let result = null;
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
            
            try {
                const resultResponse = await axios.post('https://api.yescaptcha.com/getTaskResult', {
                    clientKey: CLIENT_KEY,
                    taskId: response.data.taskId
                });
                
                logger.debug(`第 ${i+1} 次检查结果状态: ${resultResponse.data.status}`);
                
                if (resultResponse.data.status === 'ready') {
                    result = resultResponse.data.solution.token;
                    break;
                }
            } catch (err) {
                logger.error(`获取任务结果出错(第 ${i+1} 次尝试): ${err.message}`);
            }
        }
        
        if (result) {
            logger.success("✅ CAPTCHA 成功完成!");
            return result;
        } else {
            logger.error("❌ 未能获取有效的验证码解决方案");
            return null;
        }
    } catch (error) {
        logger.error(`⚠️ 完成 CAPTCHA 时出错: ${error.message}`);
        return null;
    }
}

// 领取水龙头代币
async function claimFaucet(wallet, proxy, index) {
    logger.info(`🔄 [${index+1}] 钱包地址: ${wallet}`);
    logger.info(`   代理: ${proxy}`);
    
    try {
        // 检查是否已经在8小时内领取过
        const history = loadClaimHistory();
        const lastClaim = history[wallet];
        const now = Date.now();
        
        if (lastClaim && (now - lastClaim) < WAIT_TIME) {
            const timeLeft = Math.floor((WAIT_TIME - (now - lastClaim)) / 1000 / 60); // 剩余分钟数
            logger.warn(`⚠️ 该钱包在 ${new Date(lastClaim).toLocaleString()} 已领取过测试币，需再等待约 ${timeLeft} 分钟`);
            return false;
        }
        
        let turnstileToken = await solveCaptcha(proxy);
        if (!turnstileToken) {
            logger.error("❌ 由于无法获取CAPTCHA令牌，跳过此钱包。");
            return false;
        }

        let data = {
            address: wallet,
            turnstile_response: turnstileToken
        };

        // 格式化代理URL
        const formattedProxy = formatProxyUrl(proxy);
        logger.info(`使用代理: ${formattedProxy || '无代理'}`);
        let agent = formattedProxy ? new HttpsProxyAgent(formattedProxy) : undefined;

        for (let i = 0; i < 3; i++) { // 最多重试 3 次
            try {
                logger.info(`发送领取请求 (尝试 ${i + 1}/3)...`);
                let response = await axios.post(FAUCET_URL, data, {
                    headers: {
                        "accept": "application/json, text/plain, */*",
                        "content-type": "application/json",
                        "origin": "https://app.testnet.initia.xyz",
                        "referer": "https://app.testnet.initia.xyz/",
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
                    },
                    httpsAgent: agent,
                    timeout: 30000 // 30秒超时
                });
                
                if (response.status === 200) {
                    logger.success(`✅ 成功为 ${wallet} 领取测试币，响应: ${JSON.stringify(response.data)}`);
                    
                    // 更新领取历史
                    history[wallet] = Date.now();
                    saveClaimHistory(history);
                    
                    logger.info("等待 30 秒后进行下一个钱包...");
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    return true;
                } else {
                    logger.warn(`⚠️ 服务器返回非200状态码: ${response.status}`);
                }
            } catch (error) {
                logger.error(`❌ 领取失败 (尝试 ${i + 1}/3) ${wallet}`);
                if (error.response) {
                    const responseData = error.response.data;
                    logger.error(`服务器响应: ${error.response.status} - ${typeof responseData === 'object' ? JSON.stringify(responseData) : responseData}`);
                    
                    // 如果是因为最近已领取错误
                    if (typeof responseData === 'string' && responseData.includes('recently received funds')) {
                        // 更新领取历史
                        logger.warn('水龙头提示：该账户最近已领取过资金，8小时内只能领取一次');
                        history[wallet] = Date.now();
                        saveClaimHistory(history);
                        return false;
                    }
                } else if (error.request) {
                    logger.error(`请求未收到响应: ${error.message}`);
                } else {
                    logger.error(`请求配置错误: ${error.message}`);
                }
                
                logger.info("⏳ 等待 30 秒后重试...");
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
        logger.error(`❌ 达到最大重试次数，跳过钱包 ${wallet}`);
        return false;
    } catch (error) {
        logger.error(`💥 处理钱包 ${wallet} 时遇到严重错误: ${error.message}`);
        return false;
    }
}

// 启动自动领取
async function startAutoClaim() {
    logger.info("正在启动自动领取程序...");
    
    // 加载钱包和代理
    const wallets = loadWallets(WALLET_FILE);
    const proxies = loadProxies(PROXY_FILE);
    
    // 确保钱包和代理数量匹配
    if (wallets.length > proxies.length) {
        logger.error(`钱包数量 (${wallets.length}) 多于代理数量 (${proxies.length}), 请确保每个钱包有对应的代理`);
        process.exit(1);
    }
    
    // 无限循环，每8小时03分钟一轮
    while (true) {
        logger.info("====== 开始新一轮领取 ======");
        let claimCount = 0;
        
        // 遍历钱包，每个钱包对应一个代理
        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];
            const proxy = proxies[i]; // 一一对应
            
            const success = await claimFaucet(wallet, proxy, i);
            if (success) {
                claimCount++;
            }
        }
        
        logger.success(`====== 本轮完成，成功领取: ${claimCount}/${wallets.length} ======`);
        
        // 等待8小时03分钟后再次开始
        const nextRound = new Date(Date.now() + WAIT_TIME);
        logger.info(`⏳ 等待至 ${nextRound.toLocaleString()} 后开始下一轮领取...`);
        await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    }
}

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
    logger.error(`未捕获的异常: ${error.message}`);
    logger.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`未处理的Promise拒绝: ${reason}`);
});

// 启动程序
startAutoClaim();