module.exports = {
    "title": "顽石",
    "description": "顽石个人站点",
    "dest": "public",
    "head": [
        [
            "link",
            {
                "rel": "icon",
                "href": "/favicon.ico"
            }
        ],
        [
            "meta",
            {
                "name": "viewport",
                "content": "width=device-width,initial-scale=1,user-scalable=no"
            }
        ]
    ],
    "theme": "reco",
    "themeConfig": {
        "valineConfig": {
            "appId": 'DrENwwmzTi79DABNv4QBJfVX-gzGzoHsz', // your appId
            "appKey": 'esE7nddVj2pgcg3Ihb4T5F8v', // your appKey
        },
        "nav": [{
                "text": "首页",
                "link": "/",
                "icon": "reco-home"
            },
            {
                "text": "时间轴",
                "link": "/timeline/",
                "icon": "reco-date"
            },
            {
                "text": "文档",
                "icon": "reco-message",
                "items": [{
                    "text": "vuepress-reco",
                    "link": "/docs/theme-reco/"
                }]
            },
            {
                "text": "联系我",
                "icon": "reco-message",
                "items": [{
                    "text": "GitHub",
                    "link": "https://github.com/gyy2046",
                    "icon": "reco-github"
                }]
            }
        ],
        "sidebar": {
            "/docs/theme-reco/": [
                "",
                "theme",
                "plugin",
                "api"
            ]
        },
        "type": "blog",
        "blogConfig": {
            "category": {
                "location": 2,
                "text": "分类"
            },
            "tag": {
                "location": 3,
                "text": "标签"
            }
        },
        "friendLink": [{
                "title": "午后南杂",
                "desc": "Enjoy when you can, and endure when you must.",
                "email": "1156743527@qq.com",
                "link": "https://www.recoluan.com"
            },
            {
                "title": "vuepress-theme-reco",
                "desc": "A simple and beautiful vuepress Blog & Doc theme.",
                "avatar": "https://vuepress-theme-reco.recoluan.com/icon_vuepress_reco.png",
                "link": "https://vuepress-theme-reco.recoluan.com"
            }
        ],
        "logo": "/logo.png",
        "search": true,
        "searchMaxSuggestions": 10,
        "lastUpdated": "Last Updated",
        "author": "gyy",
        "authorAvatar": "/avatar.jpg",
        "startYear": "2021"
    },
    "markdown": {
        "lineNumbers": true
    },
    configureWebpack: {
        resolve: {
            alias: {
                '@foodImg': 'food/'
            }
        }
    }
}